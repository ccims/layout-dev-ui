import { ref } from 'vue';

export const viewChanger = ref(new Map<string, Function[]>());

export function emit(event: string, ...args: any[]) {
    const handlers = viewChanger.value.get(event);
    if (handlers) {
        handlers.forEach(handler => handler(...args));
    }
}

export function receive(event: string, handler: Function) {
    if (!viewChanger.value.has(event)) {
        viewChanger.value.set(event, []);
    }
    viewChanger.value.get(event)!.push(handler);
}