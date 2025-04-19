// js/dashboard.js
import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Wait for auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("userEmail").textContent = user.email;
    loadQuizzes();
    loadRecentResults();
  } else {
    window.location.href = "index.html";
  }
});

// Logout button
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});

// Load quizzes from Firestore
async function loadQuizzes() {
  const quizList = document.getElementById("quizList");
  quizList.innerHTML = "<li>Loading quizzes...</li>";

  try {
    const q = query(collection(db, "quizzes"), orderBy("title"));
    const querySnapshot = await getDocs(q);
    quizList.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const quiz = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${quiz.title}</strong>
        <span>${quiz.questions?.length || 0} questions</span>
      `;
      li.onclick = () => {
        window.location.href = `quiz.html?id=${doc.id}`;
      };
      quizList.appendChild(li);
    });

    if (quizList.innerHTML === "") {
      quizList.innerHTML = "<li>No quizzes available.</li>";
    }
  } catch (error) {
    console.error("Error loading quizzes:", error);
    quizList.innerHTML = "<li>Error loading quizzes. Please try again.</li>";
  }
}

// Load user's recent results
async function loadRecentResults() {
  const resultsSection = document.createElement("div");
  resultsSection.innerHTML = `
    <h3>Your Recent Results</h3>
    <div id="recentResults">Loading...</div>
  `;
  document.querySelector(".container").appendChild(resultsSection);

  try {
    const resultsQuery = query(
      collection(db, "results"),
      orderBy("submittedAt", "desc"),
      where("userId", "==", auth.currentUser.uid),
      limit(3)
    );
    const snapshot = await getDocs(resultsQuery);
    
    const resultsDiv = document.getElementById("recentResults");
    resultsDiv.innerHTML = "";
    
    if (snapshot.empty) {
      resultsDiv.innerHTML = "<p>No results yet. Take a quiz!</p>";
      return;
    }

    snapshot.forEach(doc => {
      const result = doc.data();
      const resultEl = document.createElement("div");
      resultEl.className = "result";
      resultEl.innerHTML = `
        <p>Quiz ID: ${result.quizId}</p>
        <p>Score: ${result.score}</p>
        <small>${new Date(result.submittedAt?.toDate()).toLocaleString()}</small>
      `;
      resultsDiv.appendChild(resultEl);
    });
  } catch (error) {
    console.error("Error loading results:", error);
    document.getElementById("recentResults").innerHTML = 
      "<p>Error loading results.</p>";
  }
}
// js/dashboard.js (updated for your structure)
async function loadQuizzes() {
    const quizList = document.getElementById("quizList");
    quizList.innerHTML = "<li>Loading quizzes...</li>";
  
    try {
      const querySnapshot = await getDocs(collection(db, "quizzes"));
      quizList.innerHTML = "";
  
      querySnapshot.forEach((doc) => {
        const quiz = doc.data();
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${quiz.title}</strong>
          <p class="quiz-description">${quiz.description || "No description available"}</p>
        `;
        li.onclick = () => {
          window.location.href = `quiz.html?id=${doc.id}`;
        };
        quizList.appendChild(li);
      });
  
      if (quizList.innerHTML === "") {
        quizList.innerHTML = "<li>No quizzes available. Check back later!</li>";
      }
    } catch (error) {
      console.error("Error loading quizzes:", error);
      quizList.innerHTML = "<li class='error'>Failed to load quizzes. Please refresh.</li>";
    }
  }