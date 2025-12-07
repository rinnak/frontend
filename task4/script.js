const displayBox = document.querySelector(".display");
const displayInput = document.querySelector(".display-input");
const displayResult = document.querySelector(".display-result");
const buttons = document.querySelectorAll("button");
const operators = ["%", "÷", "×", "-", "+"];

let input = "";
let result = "";
let lastCalculation = false;

const historyList = document.querySelector(".history-list");
const clearHistoryBtn = document.querySelector(".clear-history");
let history = JSON.parse(localStorage.getItem("calcHistory") || "[]");

function showHistory() {
  historyList.innerHTML = "";
  history.slice(-10).forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
            <div class="history-expression">${item.expression} ${item.result}</div>
        `;
    div.addEventListener("click", () => {
      const expressionWithoutResult = item.expression.replace(" =", "");

      input = expressionWithoutResult;
      result = "";

      displayResult.value = input;

      lastCalculation = false;
      displayBox.classList.add("active");
    });
    historyList.appendChild(div);
  });
}

function saveToHistory(exp, res) {
  if (res === "Error" || res === "Infinity" || res === "") return;
  history.push({
    expression: exp + " =",
    result: res,
  });
  if (history.length > 50) {
    history = history.slice(-50);
  }
  localStorage.setItem("calcHistory", JSON.stringify(history));
  showHistory();
}
clearHistoryBtn.onclick = () => {
  history = [];
  localStorage.removeItem("calcHistory");
  showHistory();
};

const calculate = (btnValue) => {
  const lastChar = input.slice(-1),
    secondToLastChar = input.slice(-2, -1),
    withoutLastChar = input.slice(0, -1),
    isLastCharOperator = operators.includes(lastChar),
    isInvalidResult = ["Error", "Infinity"].includes(result);

  let { openBracketsCount, closeBracketsCount } = countBrackets(input);

  if (btnValue === "=") {
    if (
      input === "" ||
      lastChar === "." ||
      lastChar === "(" ||
      (isLastCharOperator && lastChar !== "%") ||
      lastCalculation
    )
      return;

    while (openBracketsCount > closeBracketsCount) {
      input += ")";
      closeBracketsCount++;
    }

    const formattedInput = replaceOperators(input);
    try {
      const calculatedValue = input.includes("%")
        ? calculatePercentage(input)
        : eval(formattedInput); //подсчет строки
      result = parseFloat(calculatedValue.toFixed(10)).toString();
      saveToHistory(input.replace(/=$/, ""), result);
    } catch {
      result = "Error";
    }
    input += btnValue;
    lastCalculation = true;
    displayBox.classList.add("active");
  } else if (btnValue === "AC") {
    resetCalculator("");
  } else if (btnValue === "") {
    if (lastCalculation) {
      if (isInvalidResult) resetCalculator("");
      resetCalculator(result.slice(0, -1));
    } else input = withoutLastChar;
  } else if (operators.includes(btnValue)) {
    if (lastCalculation) {
      if (isInvalidResult) return;
      resetCalculator(result + btnValue);
    } else if (
      ((input === "" || lastChar === "(") && btnValue !== "-") ||
      input === "-" ||
      lastChar === "." ||
      (secondToLastChar === "(" && lastChar === "-") ||
      ((secondToLastChar === "%" || lastChar === "%") && btnValue === "%")
    )
      return;
    else if (isLastCharOperator) input = withoutLastChar + btnValue;
    else if (lastChar === "%") input += btnValue;
    else input += btnValue;
  } else if (btnValue === ".") {
    const decimalValue = "0.";
    if (lastCalculation) resetCalculator(decimalValue);
    else if (lastChar === ")" || lastChar === "%") input += "×" + decimalValue;
    else if (input === "" || isLastCharOperator || lastChar === "(")
      input += decimalValue;
    else {
      let lastOperatorIndex = -1;
      for (const operator of operators) {
        const index = input.lastIndexOf(operator);
        if (index > lastOperatorIndex) lastOperatorIndex = index;
      }
      if (!input.slice(lastOperatorIndex + 1).includes(".")) input += btnValue;
    }
  } else if (btnValue === "( )") {
    if (lastCalculation) {
      if (isInvalidResult) resetCalculator("(");
      else resetCalculator(result + "×(");
    } else if (lastChar === "(" || lastChar === ".") return;
    else if (input === "" || (isLastCharOperator && lastChar !== "%"))
      input += "(";
    else if (openBracketsCount > closeBracketsCount) input += ")";
    else input += "×(";
  } else {
    if (lastCalculation) resetCalculator(btnValue);
    else if (input === "0") input = btnValue;
    else if (
      (operators.includes(secondToLastChar) || secondToLastChar === "(") &&
      lastChar === "0"
    )
      input = withoutLastChar + btnValue;
    else if (lastChar === ")" || lastChar === "%") input += "×" + btnValue;
    else input += btnValue; //добавляем нажату кнопку к строке кода
  }

  displayInput.value = input; //обновляем отображение
  displayResult.value = result; //показываем результат
  displayInput.scrollLeft = displayInput.scrollWidth; //скол влево
};

const replaceOperators = (input) =>
  input.replaceAll("÷", "/").replaceAll("×", "*");

const countBrackets = (input) => {
  let openBracketsCount = 0;
  let closeBracketsCount = 0;
  for (const char of input) {
    if (char === "(") openBracketsCount++;
    else if (char === ")") closeBracketsCount++;
  }
  return { openBracketsCount, closeBracketsCount };
};

const resetCalculator = (newInput) => {
  input = newInput;
  result = "";
  lastCalculation = false;
  displayBox.classList.remove("active");
};

const calculatePercentage = (input) => {
  let processedInput = "",
    numberBuffer = "";
  const bracketsState = [];
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (!isNaN(char) || char === ".") numberBuffer += char;
    else if (char == "%") {
      const percentValue = parseFloat(numberBuffer) / 100,
        prevOperator = index > 0 ? input[index - numberBuffer.length - 1] : "",
        nextOperator =
          index + 1 < input.length && operators.includes(input[index + 1])
            ? input[index + 1]
            : "";
      if (
        !prevOperator ||
        prevOperator === "+" ||
        prevOperator === "×" ||
        prevOperator === "("
      )
        processedInput += percentValue;
      else if (prevOperator === "-" || prevOperator === "+") {
        if (nextOPerator === "÷" || nextOPerator === "×")
          processedInput += percentValue;
        else
          processedInput +=
            "(" + processedInput.slice(0, -1) + ")*" + percentValue;
      }
      numberBuffer = "";
    } else if (operators.includes(char) || char === "(" || char === ")") {
      if (numberBuffer) {
        processedInput += numberBuffer;
        numberBuffer = "";
      }
      if (operators.includes(char)) processedInput += char;
      else if (char === "(") {
        processedInput += "(";
        bracketsState.push(processedInput);
        processedInput = "";
      } else {
        processedInput += ")";
        processedInput = bracketsState.pop() + processedInput;
      }
    }
  }
  if (numberBuffer) processedInput += numberBuffer;
  return eval(replaceOperators(processedInput));
};

buttons.forEach((button) => {
  button.addEventListener("click", (e) => {
    if (button.classList.contains("clear-history")) {
      return;
    }
    calculate(e.target.textContent);
  });
});

showHistory();
