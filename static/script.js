// Created by Dmitry Nazarov (https://t.me/dm_naz)


// Импорт библиотек для работы приложения
import "bootstrap";
import CryptoJS from "crypto-js";


// Инициализация переменных и констант
const tg = window.Telegram.WebApp;
const userData = tg.initDataUnsafe;

let questions = [];
let correctAnswersCount = 0;
let userCorrectAnswersCount = 0;

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

const welcomeBlock = document.getElementById("welcomeBlock");
const quizLogicBlock = document.getElementById("quizLogicBlock");
const badResultsBlock = document.getElementById("badResultsBlock");
const goodResultsBlock = document.getElementById("goodResultsBlock");
const userContactsBlock = document.getElementById("userContactsBlock");

const questionImage = document.getElementById("questionImage");
const questionText = document.getElementById("questionText");
const badResultsText = document.getElementById("badResultsText");
const goodResultsText = document.getElementById("goodResultsText");


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
    let resultsText = `Вы ответили на ${userCorrectAnswersCount} из ${correctAnswersCount} вопросов!`;

    quizLogicBlock.classList.add("d-none");

    // Проверка числа правильных ответов для отображения финальной страницы
    if (userCorrectAnswersCount != 0) {
      let percentageCorrect = Math.round(Math.ceil((userCorrectAnswersCount / correctAnswersCount) * 100) / 10) * 10;

      switch (percentageCorrect) {
        case 50:
        case 60:
        case 70:
        case 80:
        case 90:
        case 100:
          goodResultsBlock.classList.remove("d-none");
        break;

        default:
          badResultsBlock.classList.remove("d-none");
        break;
      }
    } else {
      badResultsBlock.classList.remove("d-none");
    }

    badResultsText.textContent = resultsText;
    goodResultsText.textContent = resultsText;

    return;
  }

  // Получение текущего вопроса, отображение данных на экране
  currentQuestion = questions[currentQuestionIndex];

  questionImage.src = currentQuestion.image;
  questionText.textContent = currentQuestion.question;

  window.scrollTo({
    top: questionText.offsetTop - 90,
    behavior: "smooth",
  });

  shuffleArray(currentQuestion.answers);

  currentQuestion.answers.forEach((answer, index) => {
    answerButtons[index].textContent = answer;
  });

  // Обновление переменной с хешем правильного ответа
  correctAnswerHash = currentQuestion.correctAnswer;

  currentQuestionIndex += 1;
}


// Функция для перехода от экрана приветствия к викторине
function startQuiz() {
  welcomeBlock.classList.add("d-none");
  quizLogicBlock.classList.remove("d-none");

  currentQuestionIndex = 0;
  userCorrectAnswersCount = 0;

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
      userCorrectAnswersCount += 1;
      console.log("Correct");
    } else {
      console.log("Incorrect");
    }

    userCurrentAnswer = null;
    showNextQuestion();
  } else {
    alert("Пожалуйста, выберите вариант ответа!");
  }
}


// Функция перезагрузки страницы для повторного прохождения теста
function reloadPage() {
  location.reload();
}


// Функция отображения страницы регистрации для пользователя
function sendContacts() {
  badResultsBlock.classList.add("d-none");
  goodResultsBlock.classList.add("d-none");
  userContactsBlock.classList.remove("d-none");
}


// Вызов функции получения данных для викторины при загрузке страницы
loadQuestionsObject();


// Объявление функций для доступности в глобальной области видимости
window.startQuiz = startQuiz;
window.selectOption = selectOption;
window.checkSelectedOption = checkSelectedOption;
window.reloadPage = reloadPage;
window.sendContacts = sendContacts;


// Валидация формы и отправка данных на сервис Formspree
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('contactForm');

  if (!form) return;

  // Валидация в реальном времени
  const inputs = form.querySelectorAll('input[required]');
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      validateField(this);
      showValidationFeedback(this);
    });

    input.addEventListener('blur', function() {
      validateField(this);
      showValidationFeedback(this);
    });
  });

  // Обработка отправки формы
  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    // Валидация всех полей
    let isFormValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) {
        isFormValid = false;
      }
      showValidationFeedback(input);
    });

    if (!isFormValid) {
      event.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Отправка...';
    submitBtn.disabled = true;

    try {
      // Отправка данных через Formspree
      const formData = new FormData(form);

      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Успешная отправка
        showSuccessMessage();
        form.reset();
        form.classList.remove('was-validated');
      } else {
        // Ошибка сервера
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера');
      }

    } catch (error) {
      // Ошибка сети или другая ошибка
      showErrorMessage(error.message);
    } finally {
      // Восстанавливаем кнопку
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
});

// Функции валидации (оставляем без изменений)
function validateField(input) {
  if (!input.value.trim()) {
    input.setCustomValidity('Это поле обязательно для заполнения');
    return false;
  }

  if (input.type === 'email' && input.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.value)) {
      input.setCustomValidity('Введите корректный email адрес');
      return false;
    }
  }

  input.setCustomValidity('');
  return true;
}

function validatePhone(input) {
  if (!input.value.trim()) {
    input.setCustomValidity('Поле обязательно для заполнения');
    return false;
  }

  const phoneRegex = /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;

  if (!phoneRegex.test(input.value)) {
    input.setCustomValidity('Введите корректный номер телефона');
    return false;
  }

  input.setCustomValidity('');
  return true;
}

function showValidationFeedback(input) {
  const feedbackElement = input.nextElementSibling;
  if (!feedbackElement || !feedbackElement.classList.contains('invalid-feedback')) {
    return;
  }

  if (!input.checkValidity()) {
    feedbackElement.style.display = 'block';
    input.classList.add('is-invalid');
  } else {
    feedbackElement.style.display = 'none';
    input.classList.remove('is-invalid');
  }
}

// Уведомления
function showSuccessMessage() {
  const alert = document.createElement('div');
  alert.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
  alert.style.zIndex = '9999';
  alert.innerHTML = `
    <strong>✅ Успешно!</strong> Данные отправлены. Мы свяжемся с вами в ближайшее время.
  `;

  document.body.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 3000);
}

function showErrorMessage(message) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3';
  alert.style.zIndex = '9999';
  alert.innerHTML = `
    <strong>❌ Ошибка!</strong> ${message || 'Не удалось отправить данные.'}
  `;

  document.body.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 3000);
}
