// js/quiz.js
import { db } from './firebase-config.js';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

import { auth } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// DOM Elements
const quizForm = document.getElementById("quizForm");
const questionsContainer = document.getElementById("questions");
const quizTitleEl = document.getElementById("quizTitle");
const timerEl = document.getElementById("timer");

// Global variables
let currentUser = null;
let quizId = null;
let timerInterval = null;
let quizData = null;

// Get quiz ID from URL
const urlParams = new URLSearchParams(window.location.search);
quizId = urlParams.get("id");

// Authenticate user
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    checkPreviousAttempts().then(canAttempt => {
      if (canAttempt) {
        loadQuiz();
      } else {
        alert("You've already attempted this quiz.");
        window.location.href = "dashboard.html";
      }
    });
  } else {
    alert("Please log in to access the quiz.");
    window.location.href = "index.html";
  }
});

// Check if user has already attempted this quiz
async function checkPreviousAttempts() {
  const attemptsQuery = query(
    collection(db, "results"),
    where("userId", "==", currentUser.uid),
    where("quizId", "==", quizId)
  );
  const snapshot = await getDocs(attemptsQuery);
  return snapshot.empty; // Returns true if no previous attempts
}

// Load quiz questions
// js/quiz.js (updated for your structure)
async function loadQuiz() {
    if (!quizId) {
      quizTitleEl.textContent = "Invalid Quiz ID";
      return;
    }
  
    try {
      const quizRef = doc(db, "quizzes", quizId);
      const quizSnap = await getDoc(quizRef);
  
      if (!quizSnap.exists()) {
        quizTitleEl.textContent = "Quiz not found";
        questionsContainer.innerHTML = `
          <p>This quiz doesn't exist or may have been removed.</p>
          <a href="dashboard.html">Return to Dashboard</a>
        `;
        return;
      }
  
      quizData = quizSnap.data();
      quizTitleEl.textContent = quizData.title;
      
      // Add description if available
      if (quizData.description) {
        const descEl = document.createElement("p");
        descEl.className = "quiz-description";
        descEl.textContent = quizData.description;
        quizTitleEl.after(descEl);
      }
  
      // Load questions from subcollection (if you're using that structure)
      const questionsSnapshot = await getDocs(collection(db, "quizzes", quizId, "questions"));
      const questions = [];
      questionsSnapshot.forEach(doc => {
        questions.push({ id: doc.id, ...doc.data() });
      });
  
      if (questions.length === 0) {
        questionsContainer.innerHTML = `
          <p>No questions found in this quiz.</p>
          <a href="dashboard.html">Return to Dashboard</a>
        `;
        return;
      }
  
      renderQuestions(questions);
      startTimer(quizData.timeLimit || 300); // Default to 5 minutes if no time limit set
  
    } catch (error) {
      console.error("Error loading quiz:", error);
      quizTitleEl.textContent = "Error loading quiz";
      questionsContainer.innerHTML = `
        <p>We encountered an error loading this quiz.</p>
        <a href="dashboard.html">Return to Dashboard</a>
      `;
    }
  }

// Render questions to the DOM
function renderQuestions(questions) {
  questionsContainer.innerHTML = "";

  questions.forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "question";
    div.dataset.questionId = q.id;

    const label = document.createElement("label");
    label.textContent = `${index + 1}. ${q.question}`;
    div.appendChild(label);

    if (q.type === "mcq") {
      q.options.forEach(opt => {
        const optionDiv = document.createElement("div");
        optionDiv.className = "option";
        
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = q.id;
        radio.value = opt;
        radio.id = `${q.id}-${opt.replace(/\s+/g, '-')}`;
        radio.required = !q.optional;
        
        const radioLabel = document.createElement("label");
        radioLabel.htmlFor = radio.id;
        radioLabel.textContent = opt;
        
        optionDiv.appendChild(radio);
        optionDiv.appendChild(radioLabel);
        div.appendChild(optionDiv);
      });
    } else if (q.type === "short") {
      const input = document.createElement("input");
      input.type = "text";
      input.name = q.id;
      input.required = !q.optional;
      div.appendChild(input);
    }

    questionsContainer.appendChild(div);
  });
}

// Timer function
function startTimer(seconds) {
  let timeLeft = seconds;
  updateTimerDisplay(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      autoSubmitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  timerEl.textContent = `Time Left: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
  
  // Visual feedback when time is running low
  if (seconds <= 10) {
    timerEl.style.color = "#e74c3c";
    timerEl.style.fontWeight = "bold";
  }
}

function autoSubmitQuiz() {
  alert("Time's up! Submitting your quiz...");
  quizForm.requestSubmit();
}

// Submit and grade quiz
// js/quiz.js - submit handler (updated for your structure)
quizForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearInterval(timerInterval);
    
    const submitBtn = quizForm.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
  
    try {
      const formData = new FormData(quizForm);
      const answers = {};
      formData.forEach((value, key) => {
        answers[key] = value;
      });
  
      // Calculate score based on your quiz structure
      let score = 0;
      const questionsSnapshot = await getDocs(collection(db, "quizzes", quizId, "questions"));
      questionsSnapshot.forEach(qDoc => {
        const question = qDoc.data();
        if (question.correctAnswer && answers[question.id] === question.correctAnswer) {
          score++;
        }
      });
  
      // Save result according to your structure
      await addDoc(collection(db, "results"), {
        userId: currentUser.uid,
        quizId: quizId,
        answers: answers,
        score: score,
        totalQuestions: questionsSnapshot.size,
        submittedAt: serverTimestamp()
      });
  
      // Redirect to results page with both quiz and attempt IDs
      window.location.href = `results.html?quizId=${quizId}`;
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Answers";
    }
  });

// Calculate score based on answers
function calculateScore(answers, questions) {
  let score = 0;
  
  questions.forEach(q => {
    if (!answers[q.id]) return;
    
    if (q.type === "mcq" && q.correctAnswer) {
      if (answers[q.id].trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        score++;
      }
    } else if (q.type === "short" && q.keywords) {
      const answer = answers[q.id].trim().toLowerCase();
      const matchedKeyword = q.keywords.some(keyword => 
        answer.includes(keyword.toLowerCase())
      );
      if (matchedKeyword) score++;
    }
  });
  
  return score;
}