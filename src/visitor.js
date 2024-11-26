const fsPromises = require("fs/promises");
const { resolve, join } = require("node:path");

class Visitor {
  #fullName;
  #age;
  #visitDate;
  #visitTime;
  #comments;
  #assistant;

  constructor(person = {}) {
    this.#fullName = this.validateFullName(person.fullName, "fullName");
    this.#age = this.validateAge(person.age);
    this.#visitDate = this.validateVisitDate(person.visitDate);
    this.#visitTime = this.validateVisitTime(person.visitTime, "visitTime");
    this.#comments = this.validateComments(person.comments, "comments");
    this.#assistant = this.validateFullName(person.assistant, "assistant");
  }

  get fullName() {
    return this.#fullName;
  }
  get age() {
    return this.#age;
  }
  get visitDate() {
    return this.#visitDate;
  }
  get visitTime() {
    return this.#visitTime;
  }
  get comments() {
    return this.#comments;
  }
  get assistant() {
    return this.#assistant;
  }

  async save() {
    try {
      const directory = resolve(__dirname, "visitors");
      const filePath = createFilePath("visitors", this.#fullName);

      await fsPromises.mkdir(directory, { recursive: true });

      const data = JSON.stringify(
        {
          fullName: this.fullName,
          age: this.age,
          visitDate: this.visitDate,
          visitTime: this.visitTime,
          comments: this.comments,
          assistant: this.assistant,
        },
        null,
        2,
      );

      await fsPromises.writeFile(filePath, data, "utf8");

      const fileName = filePath.match(/[^\/]+$/)[0];
      console.log(`${fileName} is saved successfully!`);
    } catch (err) {
      throw new Error(`Error saving file: ${err.message}`);
    }
  }

  validateStrParam(value, paramName) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`${paramName} must be a non-empty string`);
    }
    return value;
  }

  validateFullName(fullName, propName) {
    this.validateStrParam(fullName, propName);
    const names = fullName.trim().split(" ");
    const charLimit = 70;
    const regex = /^[a-zA-Z\s]+$/;

    if (names.length < 2) {
      throw new Error(
        `${propName} expects at least a first name AND last name`,
      );
    }

    if (names.join("").length > charLimit) {
      throw new Error(`${propName} expects less than ${charLimit} characters`);
    }

    if (regex.test(fullName) === false) {
      throw new Error(`${propName} should only contain alphabetic characters`);
    }

    return fullName;
  }

  validateAge(age) {
    if (!Number.isInteger(age)) {
      throw new Error("age must be an integer");
    }

    if (age <= 0) {
      throw new Error("age must be a positive integer");
    }
    return age;
  }

  validateVisitDate(date) {
    this.validateStrParam(date, "visitDate");

    const regex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (regex.test(date) === false) {
      throw new Error("visitDate is not correctly formatted in dd/mm/yyyy");
    }

    const [day, month, year] = date.split("/").map(Number);

    if (month < 1 || month > 12) {
      throw new Error(
        "visitDate has an invalid month. Month should be between 01 and 12",
      );
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      throw new Error(
        `visitDate has an invalid day for the month ${month}. The day should be between 01 and ${daysInMonth}`,
      );
    }

    return date;
  }

  validateVisitTime(time) {
    this.validateStrParam(time, "visitTime");

    const regex = /^\d{2}:\d{2}$/;

    if (regex.test(time) === false) {
      throw new Error("visitTime is not correctly formatted in hh:mm");
    }

    const [hours, minutes] = time.split(":").map(Number);

    if (hours < 0 || hours > 23) {
      throw new Error(
        "visitTime has an invalid hour. Hour should be between 00 and 23",
      );
    }

    if (minutes < 0 || minutes > 59) {
      throw new Error(
        "visitTime has an invalid minute. Minute should be between 00 and 59",
      );
    }
    return time;
  }

  validateComments(comments) {
    if (typeof comments !== "string") {
      throw new Error("comments must receive string data");
    }

    if (comments.trim() === "") {
      this.#comments = "No comment";
      return this.#comments;
    } else {
      return comments;
    }
  }
}

async function load(name) {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error(
      "load expects a non-empty string of the visitor's full name",
    );
  }

  try {
    const filePath = createFilePath("visitors", name);
    const contents = await fsPromises.readFile(filePath, { encoding: "utf8" });
    console.log(JSON.parse(contents));
  } catch (err) {
    throw new Error(
      `An error occurred while loading the visitor file: ${err.message}`,
    );
  }
}

function createFilePath(directory, visitorName) {
  const fileName = `visitor_${visitorName.toLowerCase().replace(/\s+/g, "_")}.json`;
  const filePath = resolve(__dirname, directory, fileName);
  return filePath;
}

module.exports = { Visitor, load };
