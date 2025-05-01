
export function isScrolledToBottom(el: HTMLElement) {
    return (el.scrollHeight - el.scrollTop) === el.clientHeight;
}