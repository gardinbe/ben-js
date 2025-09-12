/**
 * Returns all comment nodes that match the provided text.
 * @param node - Node to search.
 * @param text - Text to match.
 * @returns Marker comment nodes.
 * @internal
 */
export const getMarkers = (node: Node, text: string): Comment[] => {
  const comments =
    node.nodeType === Node.COMMENT_NODE && node.textContent === text ? ([node] as Comment[]) : [];
  const childComments = [...node.childNodes].flatMap((child) => getMarkers(child, text));
  return comments.concat(childComments);
};
