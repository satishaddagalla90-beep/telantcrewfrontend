declare module 'lodash/debounce' {
    function debounce<T extends (...args: any[]) => any>(func: T, wait?: number, options?: object): T;
    export = debounce;
}