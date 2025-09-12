/**
 * Represents HTML attributes.
 */
export type HTMLAttributes = {
  /**
   * Defines an identifier (ID) which must be unique in the whole document
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id
   */
  id?: string;

  /**
   * List of the classes of the element.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/class
   */
  class?: string;

  /**
   * Contains CSS styling declarations to be applied to the element.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/style
   */
  style?: string;

  [key: string]: string;
};
