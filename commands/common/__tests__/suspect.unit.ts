import { getFirstLastName } from "../suspect";

describe(getFirstLastName, () => {
  test("should handle Jr.", () => {
    const { firstName, lastName } = getFirstLastName("Rafael Valadez Jr.");
    expect(firstName).toEqual("Rafael");
    expect(lastName).toEqual("Valadez");
  });

  test("should handle no suffix", () => {
    const { firstName, lastName } = getFirstLastName("Louis Valentin");
    expect(firstName).toEqual("Louis");
    expect(lastName).toEqual("Valentin");
  });

  test("should handle extra spaces", () => {
    const { firstName, lastName } = getFirstLastName("Edward  Vallejo");
    expect(firstName).toEqual("Edward");
    expect(lastName).toEqual("Vallejo");
  });

  test("should handle multiple last names", () => {
    const { firstName, lastName } = getFirstLastName("Hector Emanuel Vargas Santos");
    expect(firstName).toEqual("Hector");
    expect(lastName).toEqual("Vargas Santos");
  });

  test("should handle middle initial", () => {
    const { firstName, lastName } = getFirstLastName("Philip C. Vogel");
    expect(firstName).toEqual("Philip");
    expect(lastName).toEqual("Vogel");
  });

  test("should handle IV", () => {
    const { firstName, lastName } = getFirstLastName("John Clarence Wilkerson IV");
    expect(firstName).toEqual("John");
    expect(lastName).toEqual("Wilkerson");
  });

  test("should handle III", () => {
    const { firstName, lastName } = getFirstLastName("George Amos Tenney III");
    expect(firstName).toEqual("George");
    expect(lastName).toEqual("Tenney");
  });

  test("should handle Sr.", () => {
    const { firstName, lastName } = getFirstLastName("Jonathan Ace Sanders, Sr.");
    expect(firstName).toEqual("Jonathan");
    expect(lastName).toEqual("Sanders");
  });

  test("should handle Updated", () => {
    const { firstName, lastName } = getFirstLastName("Larry Rendall Brock Updated");
    expect(firstName).toEqual("Larry");
    expect(lastName).toEqual("Brock");
  });

  test("should handle New", () => {
    const { firstName, lastName } = getFirstLastName("Jonathan David Grace New");
    expect(firstName).toEqual("Jonathan");
    expect(lastName).toEqual("Grace");
  });
});
