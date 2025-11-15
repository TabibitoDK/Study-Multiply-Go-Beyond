import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data')

await fs.mkdir(DATA_DIR, { recursive: true })

const modelRegistry = new Map()
const collectionRegistry = new Map()

const DOC_MARKER = Symbol('jsonDocument')
const JSON_SPACES = 2

export const initializeJsonDatabase = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

const structuredCloneSupported = typeof globalThis.structuredClone === 'function'

const cloneValue = value => {
  if (value === null || value === undefined) {
    return value
  }
  if (structuredCloneSupported) {
    try {
      return globalThis.structuredClone(value)
    } catch (error) {
      // Fallback below if structuredClone fails (e.g., with class refs)
    }
  }
  if (Array.isArray(value)) {
    return value.map(item => cloneValue(item))
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'object') {
    const cloned = {}
    for (const key of Object.keys(value)) {
      cloned[key] = cloneValue(value[key])
    }
    return cloned
  }
  return value
}

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const normalizeId = value => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'object') {
    if (value._id !== undefined) {
      return String(value._id)
    }
    if (value.id !== undefined) {
      return String(value.id)
    }
  }
  return String(value)
}

const toComparable = value => {
  if (value === null || value === undefined) {
    return value
  }
  if (value instanceof Date) {
    return value.getTime()
  }
  if (typeof value === 'string') {
    const maybeDate = Date.parse(value)
    if (!Number.isNaN(maybeDate)) {
      return maybeDate
    }
    return value.toLowerCase()
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  return normalizeId(value)
}

const ensureArray = value => {
  if (value === undefined || value === null) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

const parseSelect = select => {
  if (!select) {
    return null
  }

  const descriptor = {
    include: null,
    exclude: null
  }

  if (typeof select === 'string') {
    const parts = select
      .split(/\s+/)
      .map(part => part.trim())
      .filter(Boolean)

    if (!parts.length) {
      return null
    }

    const include = new Set()
    const exclude = new Set()

    for (const field of parts) {
      if (field.startsWith('-')) {
        exclude.add(field.slice(1))
      } else {
        include.add(field)
      }
    }

    if (include.size && exclude.size) {
      // Prefer inclusive projection if both were provided
      descriptor.include = include
    } else if (include.size) {
      descriptor.include = include
    } else if (exclude.size) {
      descriptor.exclude = exclude
    }
  } else if (isPlainObject(select)) {
    const include = new Set()
    const exclude = new Set()
    for (const [field, enabled] of Object.entries(select)) {
      if (enabled === 0 || enabled === false) {
        exclude.add(field)
      } else {
        include.add(field)
      }
    }
    if (include.size) {
      descriptor.include = include
    } else if (exclude.size) {
      descriptor.exclude = exclude
    }
  }

  if (descriptor.include && !descriptor.include.has('_id')) {
    descriptor.include.add('_id')
  }

  return descriptor.include || descriptor.exclude ? descriptor : null
}

const getPathSegments = pathValue =>
  typeof pathValue === 'string' ? pathValue.split('.') : []

const deleteAtPath = (obj, pathValue) => {
  const segments = getPathSegments(pathValue)
  if (!segments.length) {
    return
  }
  const last = segments.pop()
  let current = obj
  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return
    }
    current = current[segment]
  }
  if (current && typeof current === 'object') {
    delete current[last]
  }
}

const setAtPath = (obj, pathValue, value) => {
  const segments = getPathSegments(pathValue)
  if (!segments.length) {
    return
  }
  const last = segments.pop()
  let current = obj
  for (const segment of segments) {
    if (!isPlainObject(current[segment]) && !Array.isArray(current[segment])) {
      current[segment] = {}
    }
    current = current[segment]
  }
  current[last] = value
}

const getValuesAtPath = (obj, pathValue) => {
  const segments = getPathSegments(pathValue)
  if (!segments.length) {
    return []
  }
  const results = []

  const traverse = (node, index) => {
    if (node === undefined || node === null) {
      return
    }
    const key = segments[index]
    if (index === segments.length - 1) {
      const value = node[key]
      if (Array.isArray(value)) {
        results.push(...value)
      } else {
        results.push(value)
      }
      return
    }
    const next = node[key]
    if (Array.isArray(next)) {
      next.forEach(item => traverse(item, index + 1))
    } else if (isPlainObject(next)) {
      traverse(next, index + 1)
    }
  }

  traverse(obj, 0)
  return results
}

const collectPathEntries = (obj, pathValue) => {
  const segments = getPathSegments(pathValue)
  if (!segments.length) {
    return []
  }
  const entries = []

  const traverse = (node, index) => {
    if (!node || typeof node !== 'object') {
      return
    }
    const key = segments[index]
    if (!(key in node)) {
      return
    }
    if (index === segments.length - 1) {
      entries.push({ parent: node, key, value: node[key] })
      return
    }
    const next = node[key]
    if (Array.isArray(next)) {
      next.forEach(item => traverse(item, index + 1))
    } else if (isPlainObject(next)) {
      traverse(next, index + 1)
    }
  }

  traverse(obj, 0)
  return entries
}

const applySelection = (source, selection) => {
  if (!selection) {
    return source
  }

  if (selection.include) {
    const result = {}
    for (const field of selection.include) {
      const values = collectPathEntries({ root: source }, `root.${field}`)
      values.forEach(entry => {
        if (entry.value !== undefined) {
          setAtPath(result, field, cloneValue(entry.value))
        }
      })
    }
    return result
  }

  if (selection.exclude) {
    const clone = cloneValue(source) || {}
    for (const field of selection.exclude) {
      deleteAtPath(clone, field)
    }
    return clone
  }

  return source
}
const collectStringValues = (value, acc) => {
  if (value === null || value === undefined) {
    return
  }
  if (typeof value === 'string') {
    acc.push(value.toLowerCase())
    return
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    acc.push(String(value).toLowerCase())
    return
  }
  if (Array.isArray(value)) {
    value.forEach(item => collectStringValues(item, acc))
    return
  }
  if (isPlainObject(value)) {
    for (const child of Object.values(value)) {
      collectStringValues(child, acc)
    }
  }
}

const matchesText = (doc, search, fields = null) => {
  if (!search) {
    return true
  }
  const normalizedTerms = search
    .split(/\s+/)
    .map(term => term.trim().toLowerCase())
    .filter(Boolean)

  if (!normalizedTerms.length) {
    return true
  }

  const haystack = []

  if (Array.isArray(fields) && fields.length) {
    fields.forEach(field => {
      const values = getValuesAtPath(doc, field)
      values.forEach(value => collectStringValues(value, haystack))
    })
  } else {
    collectStringValues(doc, haystack)
  }

  if (!haystack.length) {
    return false
  }

  return normalizedTerms.every(term =>
    haystack.some(entry => entry.includes(term))
  )
}

const matchesRegex = (value, pattern, options = '') => {
  if (value === null || value === undefined) {
    return false
  }
  const flags = typeof options === 'string' ? options : ''
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, flags)
  const text = typeof value === 'string' ? value : String(value)
  return regex.test(text)
}

const compareValues = (left, right) => {
  const comparableLeft = toComparable(left)
  const comparableRight = toComparable(right)
  if (comparableLeft === comparableRight) {
    return 0
  }
  if (comparableLeft === undefined || comparableLeft === null) {
    return -1
  }
  if (comparableRight === undefined || comparableRight === null) {
    return 1
  }
  return comparableLeft > comparableRight ? 1 : -1
}

const matchesCondition = (docValue, condition) => {
  if (condition && typeof condition === 'object' && !Array.isArray(condition) && !(condition instanceof Date)) {
    if ('$in' in condition) {
      const values = (condition.$in || []).map(item => normalizeId(item))
      if (Array.isArray(docValue)) {
        return docValue.some(val => values.includes(normalizeId(val)))
      }
      return values.includes(normalizeId(docValue))
    }

    if ('$nin' in condition) {
      const values = (condition.$nin || []).map(item => normalizeId(item))
      if (Array.isArray(docValue)) {
        return docValue.every(val => !values.includes(normalizeId(val)))
      }
      return !values.includes(normalizeId(docValue))
    }

    if ('$ne' in condition) {
      return normalizeId(docValue) !== normalizeId(condition.$ne)
    }

    if ('$exists' in condition) {
      const exists = docValue !== undefined && docValue !== null
      return condition.$exists ? exists : !exists
    }

    if ('$regex' in condition) {
      return matchesRegex(docValue, condition.$regex, condition.$options)
    }

    if ('$gte' in condition) {
      if (compareValues(docValue, condition.$gte) < 0) {
        return false
      }
    }

    if ('$gt' in condition) {
      if (compareValues(docValue, condition.$gt) <= 0) {
        return false
      }
    }

    if ('$lte' in condition) {
      if (compareValues(docValue, condition.$lte) > 0) {
        return false
      }
    }

    if ('$lt' in condition) {
      if (compareValues(docValue, condition.$lt) >= 0) {
        return false
      }
    }

    // Nested equality
    return Object.entries(condition).every(([key, value]) => {
      if (key.startsWith('$')) {
        return true
      }
      if (docValue === null || docValue === undefined) {
        return false
      }
      return matchesCondition(docValue[key], value)
    })
  }

  if (Array.isArray(docValue)) {
    return docValue.some(value => matchesCondition(value, condition))
  }

  if (docValue instanceof Date && condition instanceof Date) {
    return docValue.getTime() === condition.getTime()
  }

  if (docValue instanceof Date || condition instanceof Date) {
    return compareValues(docValue, condition) === 0
  }

  return normalizeId(docValue) === normalizeId(condition)
}

const matchesFilter = (doc, filter, model) => {
  if (!filter || !Object.keys(filter).length) {
    return true
  }

  for (const [key, value] of Object.entries(filter)) {
    if (key === '$and') {
      const clauses = Array.isArray(value) ? value : []
      if (!clauses.every(clause => matchesFilter(doc, clause, model))) {
        return false
      }
      continue
    }

    if (key === '$or') {
      const clauses = Array.isArray(value) ? value : []
      if (!clauses.some(clause => matchesFilter(doc, clause, model))) {
        return false
      }
      continue
    }

    if (key === '$text') {
      const search = value && typeof value === 'object' ? value.$search : value
      if (!matchesText(doc, search, model?._textFields)) {
        return false
      }
      continue
    }

    const values = key === '_id' ? [doc._id] : getValuesAtPath(doc, key)
    const match = values.length
      ? values.some(fieldValue => matchesCondition(fieldValue, value))
      : matchesCondition(undefined, value)

    if (!match) {
      return false
    }
  }

  return true
}
const generateId = () => crypto.randomBytes(12).toString('hex')

const applyDefaults = (target, defaults) => {
  if (!isPlainObject(defaults)) {
    return
  }
  for (const [key, value] of Object.entries(defaults)) {
    if (Array.isArray(value)) {
      if (!Array.isArray(target[key])) {
        target[key] = cloneValue(value)
      }
    } else if (isPlainObject(value)) {
      if (!isPlainObject(target[key])) {
        target[key] = {}
      }
      applyDefaults(target[key], value)
    } else if (typeof value === 'function') {
      if (target[key] === undefined) {
        target[key] = value()
      }
    } else if (target[key] === undefined) {
      target[key] = value
    }
  }
}

const mergeDeep = (target, source) => {
  if (!isPlainObject(source)) {
    return source
  }
  const result = isPlainObject(target) ? target : {}
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      result[key] = value.map(item => cloneValue(item))
    } else if (isPlainObject(value)) {
      result[key] = mergeDeep(result[key], value)
    } else {
      result[key] = value
    }
  }
  return result
}

const assignSubdocumentIds = (doc, paths) => {
  if (!Array.isArray(paths) || !paths.length) {
    return
  }
  for (const pathValue of paths) {
    const entries = collectPathEntries(doc, pathValue)
    entries.forEach(entry => {
      const value = entry.value
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === 'object' && !item._id) {
            item._id = generateId()
          }
        })
      } else if (value && typeof value === 'object' && !value._id) {
        value._id = generateId()
      }
    })
  }
}

const documentSave = async function () {
  const Model = this._model
  if (!this._id) {
    this._id = generateId()
  }
  Model._applyDefaults(this)
  assignSubdocumentIds(this, Model._subDocumentArrays)
  if (Model._timestamps) {
    const now = new Date().toISOString()
    if (!this.createdAt) {
      this.createdAt = now
    }
    this.updatedAt = now
  }
  const docs = await Model._getAllDocuments()
  const index = docs.findIndex(item => item._id === this._id)
  if (index === -1) {
    docs.push(this)
  } else {
    docs[index] = this
  }
  this._isNew = false
  await Model._persist()
  return this
}

const documentPopulate = async function (path, select) {
  const spec = typeof path === 'string' ? { path, select } : path
  await populateDocuments(this._model, [this], [spec], false)
  return this
}

const documentToObject = function () {
  const plain = {}
  for (const key of Object.keys(this)) {
    plain[key] = cloneValue(this[key])
  }
  return applySelection(plain, this._selection)
}

const documentToJSON = function () {
  return this.toObject()
}

const attachDocumentMethods = (Model, doc, options = {}) => {
  if (!doc) {
    return null
  }
  if (!doc._id) {
    doc._id = generateId()
  }
  if (!doc[DOC_MARKER]) {
    Object.defineProperty(doc, DOC_MARKER, { value: true, enumerable: false })
    Object.defineProperty(doc, '_model', { value: Model, writable: true, enumerable: false })
    Object.defineProperty(doc, '_isNew', { value: false, writable: true, enumerable: false })
    Object.defineProperty(doc, '_selection', { value: null, writable: true, enumerable: false })
    Object.defineProperty(doc, 'save', { value: documentSave, enumerable: false })
    Object.defineProperty(doc, 'populate', { value: documentPopulate, enumerable: false })
    Object.defineProperty(doc, 'toObject', { value: documentToObject, enumerable: false })
    Object.defineProperty(doc, 'toJSON', { value: documentToJSON, enumerable: false })
  } else {
    doc._model = Model
  }
  if (options.selection !== undefined) {
    doc._selection = options.selection
  }
  if (options.isNew !== undefined) {
    doc._isNew = options.isNew
  }
  return doc
}
const parsePopulateSpec = spec => {
  if (!spec) {
    return null
  }
  if (typeof spec === 'string') {
    return { path: spec }
  }
  const { path, select, options } = spec
  return { path, select, options }
}

const buildPopulatedDoc = (Model, doc, selection) => {
  const plain = {}
  for (const key of Object.keys(doc)) {
    plain[key] = cloneValue(doc[key])
  }
  return applySelection(plain, selection)
}

const applyPopulateOptions = (values, options = {}) => {
  if (!Array.isArray(values)) {
    return values
  }
  let result = values
  if (options.skip) {
    result = result.slice(options.skip)
  }
  if (options.limit !== undefined && options.limit !== null) {
    result = result.slice(0, options.limit)
  }
  return result
}

const populateDocuments = async (model, docs, populateSpecs, leanMode) => {
  if (!Array.isArray(populateSpecs) || !populateSpecs.length || !Array.isArray(docs) || !docs.length) {
    return
  }

  for (const rawSpec of populateSpecs) {
    const spec = parsePopulateSpec(rawSpec)
    if (!spec || !spec.path) {
      continue
    }

    const relation = model._relations?.[spec.path]
    if (!relation) {
      continue
    }

    const targetModel = typeof relation.ref === 'string'
      ? modelRegistry.get(relation.ref)
      : relation.ref

    if (!targetModel) {
      continue
    }

    const idSet = new Set()
    const entriesPerDoc = docs.map(doc => {
      const entries = collectPathEntries(doc, spec.path)
      entries.forEach(entry => {
        const value = entry.value
        if (Array.isArray(value)) {
          value.forEach(item => {
            const normalized = normalizeId(item)
            if (normalized) {
              idSet.add(normalized)
            }
          })
        } else {
          const normalized = normalizeId(value)
          if (normalized) {
            idSet.add(normalized)
          }
        }
      })
      return entries
    })

    if (!idSet.size) {
      entriesPerDoc.forEach(entries => {
        entries.forEach(entry => {
          entry.parent[entry.key] = relation.isArray ? [] : null
        })
      })
      continue
    }

    const relatedDocs = await targetModel._getDocsByIds([...idSet])
    const selection = parseSelect(spec.select)
    const mapped = new Map()
    relatedDocs.forEach(doc => {
      mapped.set(String(doc._id), buildPopulatedDoc(targetModel, doc, selection))
    })

    entriesPerDoc.forEach(entries => {
      entries.forEach(entry => {
        const currentValue = entry.parent[entry.key]
        if (Array.isArray(currentValue)) {
          const hydrated = currentValue
            .map(id => mapped.get(normalizeId(id)))
            .filter(Boolean)
          entry.parent[entry.key] = applyPopulateOptions(hydrated, spec.options || {})
        } else {
          entry.parent[entry.key] = mapped.get(normalizeId(currentValue)) || null
        }
      })
    })
  }
}
const getFirstValue = (doc, pathValue) => {
  if (pathValue === '_id') {
    return doc._id
  }
  const values = getValuesAtPath(doc, pathValue)
  return values.length ? values[0] : undefined
}

const sortBySpec = (docs, sortSpec = {}) => {
  const entries = Object.entries(sortSpec)
  if (!entries.length) {
    return docs
  }
  return docs.sort((a, b) => {
    for (const [field, direction] of entries) {
      const dir = direction >= 0 ? 1 : -1
      const left = getFirstValue(a, field)
      const right = getFirstValue(b, field)
      const comparison = compareValues(left, right)
      if (comparison !== 0) {
        return comparison * dir
      }
    }
    return 0
  })
}

class JsonQuery {
  constructor(model, filter = {}, options = {}) {
    this.model = model
    this.filter = filter
    this._sort = null
    this._limit = null
    this._skip = 0
    this._select = null
    this._populate = []
    this._lean = false
    this._single = Boolean(options.single)
    this._executor = typeof options.executor === 'function' ? options.executor : null
  }

  sort(spec = {}) {
    this._sort = spec
    return this
  }

  limit(value) {
    this._limit = typeof value === 'number' ? Math.max(0, value) : this._limit
    return this
  }

  skip(value) {
    this._skip = typeof value === 'number' ? Math.max(0, value) : this._skip
    return this
  }

  select(spec) {
    this._select = parseSelect(spec)
    return this
  }

  populate(path, select) {
    const spec = typeof path === 'string' ? { path, select } : path
    this._populate.push(spec)
    return this
  }

  lean() {
    this._lean = true
    return this
  }

  async exec() {
    let docs
    if (this._executor) {
      const result = await this._executor()
      if (Array.isArray(result)) {
        docs = result.filter(Boolean)
      } else if (result) {
        docs = [result]
      } else {
        docs = []
      }
    } else {
      docs = await this.model._getFilteredDocs(this.filter)
    }
    docs = docs.slice()
    if (this._sort) {
      sortBySpec(docs, this._sort)
    }
    if (this._skip) {
      docs = docs.slice(this._skip)
    }
    if (this._limit !== null && this._limit !== undefined) {
      docs = docs.slice(0, this._limit)
    }

    const selection = this._select
    const resultDocs = this._lean
      ? docs.map(doc => this.model._prepareLeanDoc(doc, selection))
      : docs.map(doc => this.model._prepareDocument(doc, selection))

    if (this._populate.length && resultDocs.length) {
      await populateDocuments(this.model, resultDocs, this._populate, this._lean)
    }

    if (this._single) {
      return resultDocs[0] || null
    }

    return resultDocs
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject)
  }
}
const evaluateCondExpression = (expr, doc, root) => {
  if (Array.isArray(expr)) {
    const [condition, truthy, falsy] = expr
    const conditionValue = evaluateExpression(doc, condition, root)
    return evaluateExpression(doc, conditionValue ? truthy : falsy, root)
  }
  if (isPlainObject(expr)) {
    const conditionValue = evaluateExpression(doc, expr.if, root)
    return evaluateExpression(doc, conditionValue ? expr.then : expr.else, root)
  }
  return null
}

const evaluateExpression = (doc, expr, root = doc) => {
  if (expr === undefined) {
    return undefined
  }
  if (expr === null) {
    return null
  }
  if (typeof expr === 'number' || typeof expr === 'boolean') {
    return expr
  }
  if (typeof expr === 'string') {
    if (expr === '$$ROOT') {
      return cloneValue(doc)
    }
    if (expr.startsWith('$')) {
      const pathValue = expr.slice(1)
      if (!pathValue) {
        return undefined
      }
      if (pathValue === '_id') {
        return doc._id
      }
      const values = getValuesAtPath(doc, pathValue)
      return values.length ? values[0] : undefined
    }
    return expr
  }
  if (Array.isArray(expr)) {
    return expr.map(item => evaluateExpression(doc, item, root))
  }
  if (isPlainObject(expr)) {
    if ('$size' in expr) {
      const value = evaluateExpression(doc, expr.$size, root)
      if (Array.isArray(value)) {
        return value.length
      }
      if (value && typeof value === 'object') {
        return Object.keys(value).length
      }
      return value ? 1 : 0
    }
    if ('$cond' in expr) {
      return evaluateCondExpression(expr.$cond, doc, root)
    }
    const evaluated = {}
    for (const [key, value] of Object.entries(expr)) {
      evaluated[key] = evaluateExpression(doc, value, root)
    }
    return evaluated
  }
  return expr
}

const computeAccumulator = (docs, accumulator) => {
  if (isPlainObject(accumulator)) {
    if ('$sum' in accumulator) {
      return docs.reduce((sum, doc) => {
        const value = evaluateExpression(doc, accumulator.$sum, doc)
        const numeric = typeof value === 'number' ? value : Number(value) || 0
        return sum + numeric
      }, 0)
    }
    if ('$avg' in accumulator) {
      if (!docs.length) {
        return 0
      }
      const total = computeAccumulator(docs, { $sum: accumulator.$avg })
      return total / docs.length
    }
    if ('$first' in accumulator) {
      if (!docs.length) {
        return null
      }
      return evaluateExpression(docs[0], accumulator.$first, docs[0])
    }
  }

  if (docs.length === 0) {
    return null
  }
  return evaluateExpression(docs[0], accumulator, docs[0])
}

const runGroupStage = (docs, spec) => {
  const groups = new Map()
  docs.forEach(doc => {
    const idValue = evaluateExpression(doc, spec._id ?? null, doc)
    const key = JSON.stringify(idValue)
    if (!groups.has(key)) {
      groups.set(key, { id: idValue, docs: [] })
    }
    groups.get(key).docs.push(doc)
  })

  const results = []
  groups.forEach(group => {
    const entry = { _id: group.id }
    for (const [field, accumulator] of Object.entries(spec)) {
      if (field === '_id') {
        continue
      }
      entry[field] = computeAccumulator(group.docs, accumulator)
    }
    results.push(entry)
  })
  return results
}

const projectDocs = (docs, spec) => {
  if (!spec || !Object.keys(spec).length) {
    return docs
  }
  return docs.map(doc => {
    const projected = {}
    for (const [field, expression] of Object.entries(spec)) {
      if (expression === 0) {
        continue
      }
      if (expression === 1) {
        const values = collectPathEntries({ root: doc }, `root.${field}`)
        if (values.length) {
          values.forEach(entry => setAtPath(projected, field, cloneValue(entry.value)))
        } else if (doc[field] !== undefined) {
          projected[field] = cloneValue(doc[field])
        }
        continue
      }
      if (typeof expression === 'string' && expression.startsWith('$')) {
        setAtPath(projected, field, cloneValue(evaluateExpression(doc, expression, doc)))
        continue
      }
      setAtPath(projected, field, cloneValue(evaluateExpression(doc, expression, doc)))
    }
    return projected
  })
}

const normalizeUnwindSpec = spec => {
  if (typeof spec === 'string') {
    return { path: spec.startsWith('$') ? spec.slice(1) : spec, preserveNullAndEmptyArrays: false }
  }
  return {
    path: spec.path?.startsWith('$') ? spec.path.slice(1) : spec.path,
    preserveNullAndEmptyArrays: Boolean(spec.preserveNullAndEmptyArrays)
  }
}

const unwindDocs = (docs, spec) => {
  const { path, preserveNullAndEmptyArrays } = normalizeUnwindSpec(spec)
  if (!path) {
    return docs
  }
  const results = []
  docs.forEach(doc => {
    const entries = collectPathEntries(doc, path)
    if (!entries.length) {
      if (preserveNullAndEmptyArrays) {
        results.push(cloneValue(doc))
      }
      return
    }
    let unwound = false
    entries.forEach(entry => {
      const value = entry.value
      if (Array.isArray(value) && value.length) {
        value.forEach(item => {
          const clone = cloneValue(doc)
          setAtPath(clone, path, item)
          results.push(clone)
        })
        unwound = true
      }
    })
    if (!unwound && preserveNullAndEmptyArrays) {
      const clone = cloneValue(doc)
      setAtPath(clone, path, null)
      results.push(clone)
    }
  })
  return results
}

const lookupStage = async (docs, spec) => {
  const { from, localField, foreignField, as } = spec || {}
  if (!from || !localField || !foreignField || !as) {
    return docs
  }
  const targetModel = collectionRegistry.get(from)
  if (!targetModel) {
    return docs
  }
  const foreignDocs = await targetModel._getAllDocuments()
  const lookupMap = new Map()
  foreignDocs.forEach(doc => {
    const key = normalizeId(getFirstValue(doc, foreignField))
    if (!lookupMap.has(key)) {
      lookupMap.set(key, [])
    }
    lookupMap.get(key).push(targetModel._clonePlain(doc))
  })

  docs.forEach(doc => {
    const localValues = ensureArray(getFirstValue(doc, localField))
    const matches = localValues.flatMap(value => lookupMap.get(normalizeId(value)) || [])
    doc[as] = matches.map(item => cloneValue(item))
  })

  return docs
}

const applyAggregateStage = async (docs, stage, model) => {
  if (!stage || typeof stage !== 'object') {
    return docs
  }
  const [operator, spec] = Object.entries(stage)[0] || []
  switch (operator) {
    case '$match':
      return docs.filter(doc => matchesFilter(doc, spec, model))
    case '$group':
      return runGroupStage(docs, spec)
    case '$sort':
      return sortBySpec(docs, spec)
    case '$project':
      return projectDocs(docs, spec)
    case '$limit':
      return docs.slice(0, spec)
    case '$unwind':
      return unwindDocs(docs, spec)
    case '$lookup':
      return await lookupStage(docs, spec)
    default:
      return docs
  }
}
const hasOperators = update =>
  isPlainObject(update) && Object.keys(update).some(key => key.startsWith('$'))

const applyUpdateObject = (doc, update, { isInsert = false } = {}) => {
  if (!update || !isPlainObject(update)) {
    return
  }
  if (!hasOperators(update)) {
    mergeDeep(doc, update)
    return
  }
  if (update.$set) {
    for (const [pathValue, value] of Object.entries(update.$set)) {
      setAtPath(doc, pathValue, value)
    }
  }
  if (isInsert && update.$setOnInsert) {
    for (const [pathValue, value] of Object.entries(update.$setOnInsert)) {
      const existing = getValuesAtPath(doc, pathValue)
      if (!existing.length) {
        setAtPath(doc, pathValue, value)
      }
    }
  }
}

const defaultCollectionName = modelName => {
  if (!modelName) {
    return 'collection'
  }
  return `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}s`
}

export const createJsonModel = (modelName, options = {}) => {
  const collectionName = options.collectionName || defaultCollectionName(modelName)
  const defaults = options.defaults || {}
  const relations = options.relations || {}
  const textFields = options.textFields || options.textSearchFields || null
  const subDocumentArrays = options.subDocumentArrays || []
  const timestamps = options.timestamps !== false
  const filePath = path.join(DATA_DIR, `${collectionName}.json`)

  class JsonModel {
    constructor(initial = {}) {
      const payload = cloneValue(initial) || {}
      payload._id = payload._id ? String(payload._id) : generateId()
      applyDefaults(payload, defaults)
      assignSubdocumentIds(payload, subDocumentArrays)
      if (timestamps) {
        const now = new Date().toISOString()
        payload.createdAt = payload.createdAt || now
        payload.updatedAt = payload.updatedAt || now
      }
      return attachDocumentMethods(JsonModel, payload, { isNew: true })
    }

    static get modelName() {
      return modelName
    }

    static get collectionName() {
      return collectionName
    }

    static async _ensureCache() {
      if (this._cache) {
        return this._cache
      }
      try {
        const raw = await fs.readFile(filePath, 'utf8')
        const data = JSON.parse(raw)
        this._cache = Array.isArray(data) ? data : []
      } catch (error) {
        this._cache = []
      }
      this._cache.forEach(doc => {
        doc._id = doc._id ? String(doc._id) : generateId()
        attachDocumentMethods(this, doc, { isNew: false })
      })
      return this._cache
    }

    static async _getAllDocuments() {
      return this._ensureCache()
    }

    static _applyDefaults(doc) {
      applyDefaults(doc, defaults)
    }

    static _prepareDocument(doc, selection) {
      return attachDocumentMethods(this, doc, { selection, isNew: false })
    }

    static _prepareLeanDoc(doc, selection) {
      const plain = this._clonePlain(doc)
      return applySelection(plain, selection)
    }

    static _clonePlain(doc) {
      const plain = {}
      for (const key of Object.keys(doc)) {
        plain[key] = cloneValue(doc[key])
      }
      return plain
    }

    static async _persist() {
      await this._ensureCache()
      const payload = (this._cache || []).map(doc => {
        const plain = {}
        for (const key of Object.keys(doc)) {
          plain[key] = doc[key]
        }
        return plain
      })
      const data = JSON.stringify(
        payload,
        (key, value) => (value instanceof Date ? value.toISOString() : value),
        JSON_SPACES,
      )
      this._writeLock = (this._writeLock || Promise.resolve()).then(() => fs.writeFile(filePath, data, 'utf8'))
      await this._writeLock
    }

    static async _getFilteredDocs(filter = {}) {
      const docs = await this._getAllDocuments()
      if (!filter || !Object.keys(filter).length) {
        return docs
      }
      return docs.filter(doc => matchesFilter(doc, filter, this))
    }

    static async _getDocsByIds(ids = []) {
      if (!ids.length) {
        return []
      }
      const targets = new Set(ids.map(id => String(id)))
      const docs = await this._getAllDocuments()
      return docs.filter(doc => targets.has(String(doc._id)))
    }

    static find(filter = {}) {
      return new JsonQuery(this, filter)
    }

    static findOne(filter = {}) {
      return new JsonQuery(this, filter, { single: true })
    }

    static findById(id) {
      return new JsonQuery(this, { _id: String(id) }, { single: true })
    }

    static findByIdAndUpdate(id, update, options = {}) {
      return new JsonQuery(this, null, {
        single: true,
        executor: async () => this._executeFindOneAndUpdate({ _id: String(id) }, update, options)
      })
    }

    static findOneAndUpdate(filter, update, options = {}) {
      return new JsonQuery(this, null, {
        single: true,
        executor: async () => this._executeFindOneAndUpdate(filter, update, options)
      })
    }

    static findByIdAndDelete(id) {
      return new JsonQuery(this, null, {
        single: true,
        executor: async () => this._executeFindOneAndDelete({ _id: String(id) })
      })
    }

    static findOneAndDelete(filter) {
      return new JsonQuery(this, null, {
        single: true,
        executor: async () => this._executeFindOneAndDelete(filter)
      })
    }

    static async _executeFindOneAndUpdate(filter, update, options = {}) {
      const docs = await this._getFilteredDocs(filter || {})
      let doc = docs[0]
      if (!doc && options.upsert) {
        const insertPayload = {}
        if (hasOperators(update)) {
          applyUpdateObject(insertPayload, { ...update, $setOnInsert: update.$setOnInsert || update.$set })
        } else {
          mergeDeep(insertPayload, update)
        }
        doc = new this(insertPayload)
        await doc.save()
        return doc
      }
      if (!doc) {
        return null
      }
      const beforeUpdate = this._clonePlain(doc)
      applyUpdateObject(doc, update, { isInsert: false })
      await doc.save()
      if (options.new === false) {
        return this._prepareDocument(beforeUpdate, null)
      }
      return doc
    }

    static async _executeFindOneAndDelete(filter) {
      const docs = await this._getFilteredDocs(filter || {})
      const doc = docs[0]
      if (!doc) {
        return null
      }
      const cache = await this._getAllDocuments()
      const index = cache.findIndex(item => item._id === doc._id)
      if (index !== -1) {
        cache.splice(index, 1)
        await this._persist()
      }
      return doc
    }

    static async deleteMany(filter = {}) {
      const docs = await this._getFilteredDocs(filter)
      if (!docs.length) {
        return { deletedCount: 0 }
      }
      const cache = await this._getAllDocuments()
      const ids = new Set(docs.map(doc => doc._id))
      const remaining = cache.filter(doc => !ids.has(doc._id))
      this._cache = remaining
      await this._persist()
      return { deletedCount: docs.length }
    }

    static async countDocuments(filter = {}) {
      const docs = await this._getFilteredDocs(filter)
      return docs.length
    }

    static async create(payload) {
      if (Array.isArray(payload)) {
        const docs = []
        for (const item of payload) {
          const doc = new this(item)
          await doc.save()
          docs.push(doc)
        }
        return docs
      }
      const doc = new this(payload)
      await doc.save()
      return doc
    }

    static async aggregate(pipeline = []) {
      await this._ensureCache()
      let docs = (this._cache || []).map(doc => this._clonePlain(doc))
      for (const stage of pipeline) {
        docs = await applyAggregateStage(docs, stage, this)
      }
      return docs
    }
  }

  JsonModel._cache = null
  JsonModel._writeLock = null
  JsonModel._defaults = defaults
  JsonModel._relations = relations
  JsonModel._textFields = textFields
  JsonModel._subDocumentArrays = subDocumentArrays
  JsonModel._timestamps = timestamps
  JsonModel._filePath = filePath

  modelRegistry.set(modelName, JsonModel)
  collectionRegistry.set(collectionName, JsonModel)

  return JsonModel
}

export default createJsonModel
