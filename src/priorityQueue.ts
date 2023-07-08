// again, pretty bad impl, it's just to get something going
// (ideal would be heap impl, too lazy to even look it up now)

export default class PriorityQueue<T> {

  #data: T[]
  #compare: (a: T, b: T) => number

  constructor(compare: (a: T, b: T) => number) {
    this.#data = []

    // negate so the first element wrt the order defined by compare
    // is actually the last element in the array
    // (more efficient)
    this.#compare = (a, b) => -compare(a, b)
  }

  enqueue(t: T) {
    this.#data.push(t)
    this.#data.sort(this.#compare)
  }

  dequeue(): T {
    const t = this.#data.pop()
    return t
  }

  isEmpty(): boolean {
    return this.#data.length == 0
  }
}