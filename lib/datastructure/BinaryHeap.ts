export interface GeneralData {
}

export class BinaryHeap {
  private _arr:GeneralData[];

  constructor(values:GeneralData[], public orderTest:{(a:GeneralData, b:GeneralData):bool;} = (a, b)=> {
    return a < b;
  }) {
    if (values !== undefined) {
      this._arr = <GeneralData[]>values.slice(0);
      var arr = this._arr, i, ln = arr.length;
      for (i = ln - 1; i >= 0; i--) {
        this.down(i);
      }
    } else {
      this._arr = [];
    }
  }

  private up(k:number) {
    var arr = this._arr,
        value = arr[k],
        orderTest = this.orderTest,
        parent;
    do {
      parent = (k - 1) >> 1;
      if (orderTest(value, arr[parent])) {
        arr[k] = arr[parent];
        k = parent;
      } else {
        break;
      }
    } while (k > 0);
    arr[k] = value;
  }

  private down(k:number) {
    var arr = this._arr,
        orderTest = this.orderTest,
        value = arr[k],
        left, right,
        ln = arr.length;
    do {
      left = k * 2 + 1;
      right = k * 2 + 2;
      if (right >= ln) {
        // No right child
        if (left < ln) {
          if (orderTest(arr[left], value)) {
            arr[k] = arr[left];
            k = left;
          }
        }
        break;
      } else {
        if (orderTest(arr[left], arr[right])) {
          if (orderTest(arr[left], value)) {
            arr[k] = arr[left];
            k = left;
          } else {
            // k is in the right place
            break;
          }
        } else if (orderTest(arr[right], value)) {
          arr[k] = arr[right];
          k = right;
        } else {
          // k is in the right place
          break;
        }
      }
    } while (true);
    arr[k] = value;
  }

  push(el:GeneralData) {
    var arr = this._arr;
    if (arguments.length > 1) {
      for (var i = 0; i < arguments.length; i++) {
        arr.push(arguments[i]);
        this.up(arr.length - 1);
      }
    } else if (arr.length === 0) {
      arr.push(el);
    } else {
      arr.push(el);
      this.up(arr.length - 1);
    }
  }

  peek():GeneralData {
    return this._arr[0];
  }

  pop():GeneralData {
    var arr = this._arr,
        value = arr[0];
    if (arr.length > 1) {
      arr[0] = arr[arr.length - 1];
      arr.length--;
      this.down(0);
    } else {
      arr.length = 0;
    }
    return value;
  }

  remove(data:GeneralData) {
    var arr = this._arr,
        i = -1, ln = arr.length - 1;
    if (ln === -1) {
      return false;
    } else if (arr[ln] === data) {
      arr.length--;
      return true;
    } else {
      while (i++ < ln) {
        if (arr[i] === data) {
          arr[i] = arr[ln];
          arr.length--;
          this.down(i);
          return true;
        }
      }
    }
    return false;
  }

  size():number {
    return this._arr.length;
  }
}