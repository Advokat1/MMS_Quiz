// Created by Dmitry Nazarov (https://t.me/dm_naz)


// Импорт библиотек для работы приложения
import "bootstrap";
import CryptoJS from "crypto-js";


// Инициализация переменных
const tg = window.Telegram.WebApp;
const userData = tg.initDataUnsafe;

let questions = [];
let correctAnswersCount;
let userCorrectAnsersCount = 0;

let currentQuestionIndex = 0;
let currentQuestion;
let correctAnswerHash = "";

let userCurrentAnswer = null;

const answerButtons = [
  document.getElementById("answer1"),
  document.getElementById("answer2"),
  document.getElementById("answer3"),
  document.getElementById("answer4"),
];


// Функция получения объекта с вопросами из заготовленного файла формата JSON
function loadQuestionsObject() {
  fetch("/resources/questions.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Ошибка сети при получении файла");
      }
      return response.json();
    })
    .then((data) => {
      questions = data;
      correctAnswersCount = questions.length;
      shuffleArray(questions);
    })
    .catch((error) => console.error("Ошибка загрузки вопросов:", error));
}


// Перемешивание вопросов и вариантов ответов
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}


// Функция перехода к следующему вопросу
function showNextQuestion() {
  // Проверка индекса вопроса для перехода на экран подведения итогов
  if (currentQuestionIndex >= correctAnswersCount) {
    document.getElementById("quizLogicBlock").classList.add("d-none");
    document.getElementById("resultsBlock").classList.remove("d-none");

    // TODO Проверка пользователя на повторное прохожедние теста, или блок с регистрацией или блок с результатами
    let element = document.getElementById("results");

    if (element) {
      element.textContent = `Вы ответили правильно на ${userCorrectAnsersCount} из ${correctAnswersCount}!`;
    }

    return;
  }

  // Получение текущего вопроса, отображение данных на экране
  currentQuestion = questions[currentQuestionIndex];

  document.getElementById("questionImage").src = currentQuestion.image;
  document.getElementById("questionText").textContent = currentQuestion.question;

  shuffleArray(currentQuestion.answers);

  currentQuestion.answers.forEach((answer, index) => {
    let elementId = `answer${index + 1}`;
    let element = document.getElementById(elementId);

    if (element) {
      element.textContent = answer;
    }
  });

  // Обновление переменной с хешем правильного ответа
  correctAnswerHash = currentQuestion.correctAnswer;

  currentQuestionIndex += 1;
}


// Функция для перехода от экрана приветствия к викторине
function startQuiz() {
  document.getElementById("welcomeBlock").classList.add("d-none");
  document.getElementById("quizLogicBlock").classList.remove("d-none");

  currentQuestionIndex = 0;
  userCorrectAnsersCount = 0;

  showNextQuestion();
}


// Функция выбора варианта ответа от пользователя (вызов из HTML)
function selectOption(optionIndex, btnObj) {
  userCurrentAnswer = optionIndex;

  // Обновление визуального отображения кнопок с вариантами ответов для пользователя
  answerButtons.forEach((btn) => btn.classList.remove("selected"));

  btnObj.classList.add("selected");
}


// Функция проверки выбранного варианта ответа, сообщение об ошибке при попытке перейти к следующему вопросу без выбора ответа
function checkSelectedOption() {
  // Обновление визуального отображения кнопок с вариантами ответов для пользователя
  answerButtons.forEach((btn) => btn.classList.remove("selected"));

  // Проверка ответа или сообщение для пользователя
  if (userCurrentAnswer != null) {
    let userAnswerHash = CryptoJS.SHA256(currentQuestion.answers[userCurrentAnswer - 1]);

    if (userAnswerHash == correctAnswerHash) {
      userCorrectAnsersCount += 1;
      console.log("Правильный ответ!");
    } else {
      console.log("Неправильный ответ!");
    }

    userCurrentAnswer = null;
    showNextQuestion();
  } else {
    alert("Пожалуйста, выберите вариант ответа!");
  }
}


// Вызов функции получения данных для викторины при загрузке страницы
loadQuestionsObject();


// Объявление функций для доступности в глобальной области видимости
window.startQuiz = startQuiz;
window.selectOption = selectOption;
window.checkSelectedOption = checkSelectedOption;
