export default class Queue<T> {
  // bad queue impl (better: head + tail indices, wrapping around, resizing when needed)
  // but whatever

  data: T[]

  constructor() {
    this.data = []
  }

  enqueue(x: T) {
    this.data.push(x)
  }

  dequeue(): T {
    return this.data.shift()
  }

  isEmpty(): boolean {
    return this.data.length == 0
  }
}
