function getSign(num) {
  return num < 0 ? -1 : num > 0 ? 1 : 0;
}

let Random = {
  values: [],
  value: null,
  index: null,
  setValues: function(values) {
    this.values = values;
  },
  seed: function(index) {
    this.index = index;
    this.value = this.values[index];
  },
  getNext: function(num) {
    let rand = getSign(this.value) * (num - num * Math.abs(this.value));
    let randIndex = (this.value * 10000 % 100 * 5 | 0);
    let index = this.index - randIndex;

    if (index < 0 || index > this.values.length - 1) {
      index = this.index + randIndex;
    }
    this.seed(index);

    return rand;
  }
};