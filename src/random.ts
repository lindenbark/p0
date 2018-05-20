const MAX_INT32 = 2147483647;

export default class ParkMiller {
    constructor(public seed: number) {
        this.seed %= MAX_INT32;
        if (this.seed <= 0) this.seed += MAX_INT32 - 1;
    }
    integer() { return this.seed = (this.seed * 16807) % MAX_INT32; }
    float() { return (this.integer() - 1) / (MAX_INT32 - 1); }
    floatInRange(min: number, max: number) { return min + ((max - min) * this.float()); }
    integerInRange(min: number, max: number) { return Math.round(this.floatInRange(min, max)); }
}
