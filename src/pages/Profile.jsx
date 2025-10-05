import React, { useState } from "react";
import "./Profile.css";

export default function Profile() {
  const [posts, setPosts] = useState([
    { id: 1, name: "Nickname", username: "@username", content: "Today I studied calculus for 2 hours!" },
  ]);
  const [newPost, setNewPost] = useState("");

  const addPost = () => {
    if (newPost.trim() === "") return;
    const post = {
      id: Date.now(),
      name: "Nickname",
      username: "@username",
      content: newPost,
    };
    setPosts([post, ...posts]);
    setNewPost("");
  };

  return (
    <div className="profile-container">
      {/* Profile Banner */}
      <div className="profile-banner"></div>

      {/* Profile Info */}
      <div className="profile-header">
        <div className="profile-avatar"></div>
        <div className="profile-info">
          <h2>Nickname</h2>
          <p>@username</p>
        </div>
        <button className="edit-btn">edit</button>
      </div>

      <hr className="divider" />

      <div className="profile-content">
        {/* Left Side - Tasks and Goals */}
        <div className="left-side">
          <div className="card">
            <h3>Task</h3>
            <ul>
              <li>Finish homework</li>
              <li>Review notes</li>
            </ul>
          </div>

          <div className="card">
            <h3>Goals</h3>
            <ul>
              <li>Score A in math</li>
              <li>Read 10 books this semester</li>
            </ul>
          </div>
        </div>

        {/* Right Side - Posts */}
        <div className="right-side">
          <div className="add-post">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share what you studied today..."
            />
            <button onClick={addPost}>Post</button>
          </div>

          <div className="posts">
            {posts.map((post) => (
              <div className="post-card" key={post.id}>
                <div className="post-header">
                  <div className="post-avatar"></div>
                  <div>
                    <h4>{post.name}</h4>
                    <p>{post.username}</p>
                  </div>
                </div>
                <p className="post-content">{post.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
