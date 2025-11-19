// Вариант 1: class / extends
class Student {
  constructor(firstName, lastName, schoolClass) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.schoolClass = schoolClass;
  }

  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  getClass() {
    return this.schoolClass;
  }

  setClass(newClass) {
    this.schoolClass = newClass;
  }
}

class ExtendedStudent extends Student {
  constructor(firstName, lastName, schoolClass, age) {
    super(firstName, lastName, schoolClass);
    this.age = age;
  }

  getAge() {
    return this.age;
  }

  setAge(newAge) {
    this.age = newAge;
  }
}

const students = [];

document.getElementById("studentForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const schoolClass = document.getElementById("schoolClass").value.trim();
  const age = parseInt(document.getElementById("age").value);

  const student = new ExtendedStudent(firstName, lastName, schoolClass, age);
  students.push(student);
  renderStudents();
  checkDuplicates();
});

function renderStudents() {
  const list = document.getElementById("studentList");
  list.innerHTML = "";
  students.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}) ${s.getFullName()}, класс ${s.getClass()}, возраст ${s.getAge()}`;
    list.appendChild(li);
  });
}

function checkDuplicates() {
  const surnames = students.map(s => s.lastName);
  const duplicates = surnames.filter((s, i, arr) => arr.indexOf(s) !== i && arr.lastIndexOf(s) === i);
  const result = document.getElementById("resultText");
  result.textContent = duplicates.length
    ? `Обнаружены однофамильцы: ${duplicates.join(", ")}`
    : "Однофамильцев не найдено.";
}

// Вариант 2: прототипное наследование
function BaseStudent(firstName, lastName, schoolClass) {
  this.firstName = firstName;
  this.lastName = lastName;
  this.schoolClass = schoolClass;
}
BaseStudent.prototype.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};
BaseStudent.prototype.getClass = function () {
  return this.schoolClass;
};
BaseStudent.prototype.setClass = function (newClass) {
  this.schoolClass = newClass;
};

function ProtoStudent(firstName, lastName, schoolClass, age) {
  BaseStudent.call(this, firstName, lastName, schoolClass);
  this.age = age;
}
ProtoStudent.prototype = Object.create(BaseStudent.prototype);
ProtoStudent.prototype.constructor = ProtoStudent;
ProtoStudent.prototype.getAge = function () {
  return this.age;
};
ProtoStudent.prototype.setAge = function (newAge) {
  this.age = newAge;
};
