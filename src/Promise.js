/*
 * Yet another Promise implementation
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */

class Promise {
  #promise
  #value
  #state = 'pending'

  /*
   * Promise.all
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
   */
  static all(iterable) {
    return iterable.map((v) => new Promise((resolve, reject) => resolve(v)))
  }

  /*
   * Promise.resolve
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
   */
  static resolve(value) {
    return new Promise((resolve, reject) => resolve(value))
  }

  /*
   * Promise.reject
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
   */
  static reject(reason) {
    return new Promise((resolve, reject) => reject(reason))
  }

  /*
   * Promise() constructor
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise
   */
  constructor(executor) {
    // handle TypeError
    if (executor === undefined)
      throw new TypeError('Promise resolver undefined is not a function')
    if (typeof executor !== 'function')
      throw new TypeError(`Promise resolver ${executor} is not a function`)

    // set resolutionFunc and rejectFunc
    this.resolutionFunc = (value) => {
      if (this.#state === 'pending') {
        this.#state = 'fulfilled'
        this.#value = value
      }
    }
    this.rejectFunc = (reason) => {
      if (this.#state === 'pending') {
        this.#state = 'rejected'
        this.#value = reason
      }
    }

    // call executor
    executor(this.resolutionFunc, this.rejectFunc)
  }

  /*
   * Promise.prototype.then
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
   */
  // then(onFulfilled, onRejected) {
  //   // replace internally onFultilled and onRejected
  //   if (typeof onFulfilled !== 'function') {
  //     onFulfilled = (value) => value
  //   }
  //   if (typeof onRejected !== 'function') {
  //     onRejected = (reason) => {
  //       throw new Error(reason)
  //     }
  //   }

  //   // queue onFulfilled and onRejected callbacks
  //   queueMicrotask(() => {
  //     switch (this.state) {
  //       case 'fulfilled':
  //         try {
  //           const fulfilledValue = onFulfilled(this.value)

  //           // handle when onFulfilled returns instance of Promise
  //           if (fulfilledValue instanceof Promise) {
  //             switch (fulfilledValue.state) {
  //               case 'fulfilled':
  //                 this.value = fulfilledValue.value
  //                 break
  //               case 'rejected':
  //                 this.value = fulfilledValue.value
  //                 this.state = 'rejected'
  //                 break
  //             }
  //           } else {
  //             this.value = fulfilledValue
  //           }
  //           // handle onFulfilled throws an error
  //         } catch (e) {
  //           this.value = e
  //           this.state = 'rejected'
  //         }
  //         break
  //       case 'rejected':
  //         this.value = onRejected(this.value)
  //         break
  //     }
  //   })

  //   return this
  // }

  then(onFulfilled, onRejected) {
    // replace internally onFultilled and onRejected
    if (typeof onFulfilled !== 'function') {
      onFulfilled = (value) => value
    }
    if (typeof onRejected !== 'function') {
      onRejected = (reason) => {
        throw new Error(reason)
      }
    }

    // initiate new promise
    this.#promise = Promise.resolve()

    // queue onFulfilled and onRejected callbacks
    queueMicrotask(() => this.thenQueueMicrotask(onFulfilled, onRejected))

    return this.#promise
  }

  thenQueueMicrotask(onFulfilled, onRejected) {
    switch (this.state) {
      case 'pending':
        // if Promise is pending state enqueue microtask
        queueMicrotask(() => this.thenQueueMicrotask(onFulfilled, onRejected))
        break
      case 'fulfilled':
        // set promise state to pending and resolution value
        let fulfilledValue
        try {
          fulfilledValue = onFulfilled(this.value)

          if (fulfilledValue instanceof Promise) {
            switch (fulfilledValue.state) {
              case 'pending':
                this.state = 'pending'
                queueMicrotask(() =>
                  this.promise.callResolutionOrRejectFunc(
                    'resolve',
                    () => fulfilledValue.value,
                  ),
                )
                break

              case 'fulfilled':
                this.promise.callResolutionOrRejectFunc(
                  'resolve',
                  () => fulfilledValue.value,
                )
                break

              case 'rejected':
                this.promise.callResolutionOrRejectFunc(
                  'reject',
                  () => fulfilledValue.value,
                )
                break
            }
          } else {
            this.promise.callResolutionOrRejectFunc(
              'resolve',
              () => fulfilledValue,
            )
          }
        } catch (e) {
          fulfilledValue = e
          this.promise.callResolutionOrRejectFunc(
            'reject',
            () => fulfilledValue,
          )
        }
        break

      case 'rejected':
        let rejectedValue
        rejectedValue = onRejected(this.value)

        if (rejectedValue instanceof Promise) {
          this.promise = rejectedValue
        } else {
          this.promise.callResolutionOrRejectFunc('reject', () => rejectedValue)
        }
        break
    }
  }

  callResolutionOrRejectFunc(type, getter) {
    this.state = 'pending'
    type === 'resolve'
      ? this.resolutionFunc(getter())
      : this.rejectFunc(getter())
  }

  get promise() {
    return this.#promise
  }

  get state() {
    return this.#state
  }

  set state(value) {
    this.#state = value
  }

  get value() {
    return this.#value
  }

  /*
   * Promise.prototype.catch
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
   */
  catch(onRejected) {
    this.then(() => {}, onRejected)
  }

  /*
   * Promise.prototype.finally
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally
   */
  finally(onFinally) {
    throw new Error('Not implemented yet')
  }
}

module.exports = Promise
