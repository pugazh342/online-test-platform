// js/results.js
import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

import {
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// DOM Elements
const resultDetails = document.getElementById("resultDetails");
const backBtn = document.getElementById("backToDashboard");

// Get quiz ID from URL
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get("quizId");

// Check auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (quizId) {
      await loadResult(quizId, user.uid);
    } else {
      await loadLatestResult(user.uid);
    }
  } else {
    window.location.href = "index.html";
  }
});

// Back button
backBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

// Load specific result
// js/results.js (updated for your structure)
async function loadResult(quizId, userId) {
    try {
      // Get quiz details
      const quizDoc = await getDoc(doc(db, "quizzes", quizId));
      if (!quizDoc.exists()) {
        resultDetails.innerHTML = "<p>Quiz details not found.</p>";
        return;
      }
      const quiz = quizDoc.data();
  
      // Get user's most recent attempt for this quiz
      const resultQuery = query(
        collection(db, "results"),
        where("userId", "==", userId),
        where("quizId", "==", quizId),
        orderBy("submittedAt", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(resultQuery);
  
      if (snapshot.empty) {
        resultDetails.innerHTML = `
          <p>You haven't completed this quiz yet.</p>
          <a href="quiz.html?id=${quizId}">Take the quiz now</a>
        `;
        return;
      }
  
      const resultDoc = snapshot.docs[0];
      const result = resultDoc.data();
      displayResult(quiz, result, resultDoc.id);
  
    } catch (error) {
      console.error("Error loading result:", error);
      resultDetails.innerHTML = `
        <p class="error">Error loading results.</p>
        <a href="dashboard.html">Return to Dashboard</a>
      `;
    }
  }
  
  function displayResult(quiz, result, resultId) {
    const percentage = Math.round((result.score / result.totalQuestions) * 100);
    const resultDate = result.submittedAt?.toDate().toLocaleString() || "Unknown date";
    
    resultDetails.innerHTML = `
      <div class="result-header">
        <h3>${quiz.title}</h3>
        <p class="quiz-description">${quiz.description || ""}</p>
        <p class="attempt-date">Attempted on: ${resultDate}</p>
      </div>
      
      <div class="score-summary">
        <h4>Your Score</h4>
        <div class="score-display">
          ${result.score} / ${result.totalQuestions} 
          (${percentage}%)
        </div>
      </div>
      
      <div class="detailed-results" id="detailedResults"></div>
      
      <div class="actions">
        <button id="retakeQuiz">Retake Quiz</button>
        <button id="viewDashboard">Back to Dashboard</button>
      </div>
    `;
  
    // Add event listeners for buttons
    document.getElementById("retakeQuiz").addEventListener("click", () => {
      window.location.href = `quiz.html?id=${quizId}`;
    });
    
    document.getElementById("viewDashboard").addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  
    // Load detailed question-by-question results
    loadDetailedResults(quizId, result);
  }
  
  async function loadDetailedResults(quizId, result) {
    const detailedResults = document.getElementById("detailedResults");
    detailedResults.innerHTML = "<p>Loading question details...</p>";
  
    try {
      const questionsSnapshot = await getDocs(collection(db, "quizzes", quizId, "questions"));
      detailedResults.innerHTML = "<h4>Question Review</h4>";
      
      let questionNumber = 1;
      questionsSnapshot.forEach(qDoc => {
        const question = qDoc.data();
        const userAnswer = result.answers[question.id] || "No answer provided";
        const isCorrect = question.correctAnswer 
          ? userAnswer === question.correctAnswer
          : null;
        
        const questionEl = document.createElement("div");
        questionEl.className = `question-result ${isCorrect ? 'correct' : 'incorrect'}`;
        questionEl.innerHTML = `
          <div class="question-text">
            <strong>Question ${questionNumber}:</strong> ${question.question}
          </div>
          <div class="user-answer">
            <strong>Your answer:</strong> ${userAnswer}
          </div>
          ${question.correctAnswer ? `
            <div class="correct-answer">
              <strong>Correct answer:</strong> ${question.correctAnswer}
            </div>
          ` : ''}
          <div class="result-indicator">
            ${isCorrect === true ? '✓ Correct' : isCorrect === false ? '✗ Incorrect' : 'Not graded'}
          </div>
        `;
        
        detailedResults.appendChild(questionEl);
        questionNumber++;
      });
    } catch (error) {
      console.error("Error loading questions:", error);
      detailedResults.innerHTML = `
        <p class="error">Couldn't load question details.</p>
      `;
    }
  }

// Load user's latest result
async function loadLatestResult(userId) {
  try {
    const resultQuery = query(
      collection(db, "results"),
      where("userId", "==", userId),
      orderBy("submittedAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(resultQuery);

    if (snapshot.empty) {
      resultDetails.innerHTML = "<p>No quiz results found.</p>";
      return;
    }

    const result = snapshot.docs[0].data();
    const quizDoc = await getDoc(doc(db, "quizzes", result.quizId));
    const quiz = quizDoc.data();
    
    displayResult(quiz, result);
  } catch (error) {
    console.error("Error loading latest result:", error);
    resultDetails.innerHTML = "<p>Error loading results. Please try again.</p>";
  }
}

// Display result to user
function displayResult(quiz, result) {
  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  
  resultDetails.innerHTML = `
    <h3>${quiz.title}</h3>
    <div class="score-display">
      <p>Your Score: ${result.score} out of ${result.totalQuestions}</p>
      <div class="progress-bar">
        <div class="progress" style="width: ${percentage}%"></div>
      </div>
      <p>${percentage}%</p>
    </div>
    <h4>Question Review:</h4>
    <div id="questionReview"></div>
    <p>Submitted on: ${new Date(result.submittedAt?.toDate()).toLocaleString()}</p>
  `;

  // Add question review if questions exist
  if (quiz.questions) {
    const reviewContainer = document.getElementById("questionReview");
    quiz.questions.forEach((q, index) => {
      const qDiv = document.createElement("div");
      qDiv.className = "review-question";
      
      const userAnswer = result.answers[q.id] || "No answer provided";
      let correctAnswerDisplay = "";
      
      if (q.type === "mcq" && q.correctAnswer) {
        correctAnswerDisplay = `Correct answer: ${q.correctAnswer}`;
      } else if (q.type === "short" && q.keywords) {
        correctAnswerDisplay = `Keywords: ${q.keywords.join(", ")}`;
      }
      
      qDiv.innerHTML = `
        <p><strong>Question ${index + 1}:</strong> ${q.question}</p>
        <p>Your answer: ${userAnswer}</p>
        ${correctAnswerDisplay ? `<p>${correctAnswerDisplay}</p>` : ''}
        <hr>
      `;
      reviewContainer.appendChild(qDiv);
    });
  }
}