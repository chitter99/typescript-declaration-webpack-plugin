export const message = 'Hello world!';

export function say(otherMessage?: string) {
    console.log(message || otherMessage);
}
