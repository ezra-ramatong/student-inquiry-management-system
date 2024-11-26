const { Visitor, load } = require("../src/visitor.js");
const { resolve, join } = require("path");
const fsPromises = require("fs/promises");

function getPersonData() {
  return {
    fullName: "James Blake",
    age: 31,
    visitDate: "04/07/2024",
    visitTime: "15:27",
    comments: "Lovely place",
    assistant: "Sarah Lawson",
  };
}

describe("Visitor Class", function () {
  let person;
  beforeEach(() => {
    person = getPersonData();
  });

  it("should instantiate properties as defined in the class", function () {
    const visitor = new Visitor(person);
    expect(visitor.fullName).toBe("James Blake");
    expect(visitor.age).toBe(31);
    expect(visitor.visitDate).toBe("04/07/2024");
    expect(visitor.visitTime).toBe("15:27");
    expect(visitor.comments).toBe("Lovely place");
    expect(visitor.assistant).toBe("Sarah Lawson");
  });

  it("should throw an error if the fullName property receives only a first name or only a last name", function () {
    person.fullName = "Alice ";
    expect(() => new Visitor(person)).toThrowError(
      "fullName expects at least a first name AND last name",
    );
  });

  it("should throw an error if the fullName property receives non-alphabetic characters", function () {
    person.fullName = "James Bl@k3s";
    expect(() => new Visitor(person)).toThrowError(
      "fullName should only contain alphabetic characters",
    );
  });

  const invalidStringProperties = {
    fullName: 45,
    visitDate: ["2024/05/19"],
    visitTime: false,
    assistant: "",
  };

  it(`should throw an error for invalid string properties`, function () {
    Object.keys(invalidStringProperties).forEach((key) => {
      person = getPersonData();
      person[key] = invalidStringProperties[key];
      expect(() => new Visitor(person)).toThrowError(
        `${key} must be a non-empty string`,
      );
    });
  });

  it("should throw an error if age is not an integer", function () {
    person.age = "47 years";
    expect(() => new Visitor(person)).toThrowError("age must be an integer");
  });

  it("should throw an error if age is not a positive integer", function () {
    person.age = -18;
    expect(function () {
      new Visitor(person);
    }).toThrowError("age must be a positive integer");
  });

  it("should throw an error if the visitDate property is not correctly formatted in dd/mm/yyyy", function () {
    person.visitDate = "2024-05-19";
    expect(function () {
      new Visitor(person);
    }).toThrowError("visitDate is not correctly formatted in dd/mm/yyyy");
  });

  it("should throw an error if the month of the visitDate property is out of range", function () {
    person.visitDate = "04/70/2024";
    expect(function () {
      new Visitor(person);
    }).toThrowError(
      "visitDate has an invalid month. Month should be between 01 and 12",
    );
  });

  it("should throw an error if the day of the visitDate property is invalid for the month given", function () {
    person.visitDate = "32/10/2024";
    expect(function () {
      new Visitor(person);
    }).toThrowError(
      "visitDate has an invalid day for the month 10. The day should be between 01 and 31",
    );
  });

  it("should throw an error if the visitTime property is not correctly formatted in hh:mm", function () {
    person.visitTime = "9h40 am";
    expect(function () {
      new Visitor(person);
    }).toThrowError("visitTime is not correctly formatted in hh:mm");
  });

  it("should throw an error if the hour of the visitTime property is out of range", function () {
    person.visitTime = "27:12";
    expect(function () {
      new Visitor(person);
    }).toThrowError(
      "visitTime has an invalid hour. Hour should be between 00 and 23",
    );
  });

  it("should throw an error if the minute of the visitTime property is out of range", function () {
    person.visitTime = "15:70";
    expect(function () {
      new Visitor(person);
    }).toThrowError(
      "visitTime has an invalid minute. Minute should be between 00 and 59",
    );
  });

  it("should throw an error if the comments property is not a string", function () {
    person.comments = {};
    expect(function () {
      new Visitor(person);
    }).toThrowError("comments must receive string data");
  });

  it(`should initialize the comments property with "No comment" if it receives an empty string`, function () {
    person.comments = "";
    const visitor = new Visitor(person);
    expect(visitor.comments).toBe("No comment");
  });

  it("should throw an error if the assistant property receives only a first name or only a last name", function () {
    person.assistant = "Sarah ";
    expect(() => new Visitor(person)).toThrowError(
      "assistant expects at least a first name AND last name",
    );
  });

  describe("save() method", function () {
    let visitor;
    let mkdirSpy;
    let writeFileSpy;

    const mockDir = join(__dirname, "../src/visitors");

    beforeEach(function () {
      visitor = new Visitor(person);

      mkdirSpy = spyOn(fsPromises, "mkdir").and.returnValue(Promise.resolve());
      writeFileSpy = spyOn(fsPromises, "writeFile").and.returnValue(
        Promise.resolve(),
      );
      spyOn(console, "log");
    });

    it("should call mkdir to create a directory if it does not exist", async function () {
      await visitor.save();

      expect(mkdirSpy).toHaveBeenCalledOnceWith(mockDir, {
        recursive: true,
      });
    });

    it("should call writeFile to write the file", async function () {
      await visitor.save();

      const expectedFileName = resolve(mockDir, `visitor_james_blake.json`);
      expect(writeFileSpy).toHaveBeenCalledOnceWith(
        expectedFileName,
        jasmine.any(String),
        "utf8",
      );
    });

    it("should log a success message when the visitor file is saved successfully", async function () {
      const file = "visitor_james_blake.json";
      await visitor.save();
      expect(console.log).toHaveBeenCalledOnceWith(
        `${file} is saved successfully!`,
      );
    });

    it("should throw an exception if it did not write the file successfully", async function () {
      writeFileSpy.and.returnValue(
        Promise.reject(new Error("Mocked writeFile error")),
      );

      await expectAsync(visitor.save()).toBeRejectedWithError(
        "Error saving file: Mocked writeFile error",
      );
    });
  });
});

describe("load function", function () {
  let person = getPersonData();
  let visitor;
  let readFileSpy;
  let consoleLogSpy;
  const fileName = "visitor_james_blake.json";
  const directory = join(__dirname, "..", "src", "visitors");
  const filePath = join(directory, fileName);

  beforeEach(function () {
    visitor = new Visitor(person);

    consoleLogSpy = spyOn(console, "log");
    readFileSpy = spyOn(fsPromises, "readFile").and.returnValue(
      Promise.resolve(JSON.stringify(person, null, 2)),
    );
  });

  it("should throw an error when the argument is not a non-empty string", async function () {
    await expectAsync(load(null)).toBeRejectedWithError(
      "load expects a non-empty string of the visitor's full name",
    );

    await expectAsync(load(undefined)).toBeRejectedWithError(
      "load expects a non-empty string of the visitor's full name",
    );
  });

  it("should read the contents of the given visitor's data from 'visitor_full_name.json'", async function () {
    await load("James Blake");

    expect(readFileSpy).toHaveBeenCalledOnceWith(filePath, {
      encoding: "utf8",
    });
  });

  it("should print the Visitor object of the name received as an argument", async function () {
    const personData = getPersonData();

    await load("James Blake");

    expect(consoleLogSpy).toHaveBeenCalledOnceWith(personData);
  });

  it("should throw an error if the visitor file is not found", async function () {
    readFileSpy.and.returnValue(
      Promise.reject(new Error("Mocked readFile error")),
    );

    await expectAsync(load("Thembelihle Khumalo")).toBeRejectedWithError(
      "An error occurred while loading the visitor file: Mocked readFile error",
    );
  });
});
