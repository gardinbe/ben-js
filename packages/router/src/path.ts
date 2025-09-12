import { reactive } from '@ben-js/reactivity';

/**
 * Represents the current path.
 */
export const currentPath = reactive(location.pathname);

addEventListener('popstate', () => {
  currentPath.value = location.pathname;
});

/**
 * Navigates to a path.
 * @param path - Path to navigate to.
 */
export const go = (path: string) => {
  currentPath.value = path;
  history.pushState(null, '', path);
};
