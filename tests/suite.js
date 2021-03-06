function fill(buf) {
    if (buf instanceof ArrayBuffer) {
        buf = new Uint8Array(buf);
    }
    var val = [0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF];
    for (var i=0, k=buf.length; i<k; ++i) {
        buf[i] = val[i % val.length];
    }
}

function hex(buf) {
    if (buf instanceof ArrayBuffer) {
        buf = new Uint8Array(buf);
    }
    var s, out = [];
    for (var i=0, k=buf.length; i<k; ++i) {
        s = buf[i].toString(16).toUpperCase();
        while (s.length < 2) s = "0"+s;
        out.push(s);
    }
    return out.join('');
}

var memcpy = require("../src/memcpy.js");

module.exports = {
    "interop": function(test) {
        [memcpy.binding, memcpy.native].forEach(function(memcpy) {
            [Buffer, ArrayBuffer, Uint8Array].forEach(function(Type1) {
                [Buffer, ArrayBuffer, Uint8Array].forEach(function(Type2) {
                    var b1 = new Type1(8),
                        b2 = new Type2(8);
                    test.log((memcpy === memcpy.binding ? "cc".cyan : "js".green)+" "+b1.constructor.name+" -> "+b2.constructor.name);
                    fill(b1);
                    fill(b2);
                    test.strictEqual(hex(b1), hex(b2));
                    test.strictEqual(memcpy(b2, 1, b1, 4, 7), 3);
                    test.strictEqual(hex(b2), "0189ABCD89ABCDEF");
                    test.strictEqual(memcpy(b2, b1), 8);
                    test.strictEqual(hex(b2), "0123456789ABCDEF");
                    test.strictEqual(memcpy(b2, b1, 4), 4);
                    test.strictEqual(hex(b2), "89ABCDEF89ABCDEF");
                    test.throws(function() {
                        memcpy(b2, 1, b1);
                    }, Error);
                    test.strictEqual(hex(b2), "89ABCDEF89ABCDEF");
                });
            });
        });
        test.done();
    },

    "overlap": function(test) {
        [memcpy.binding, memcpy.native].forEach(function(memcpy) {
            [Buffer, ArrayBuffer, Uint8Array].forEach(function(Type) {
                var b = new Type(8);
                test.log((memcpy === memcpy.binding ? "cc".cyan : "js".green)+" "+b.constructor.name);
                fill(b);
                test.strictEqual(hex(b), "0123456789ABCDEF");
                test.strictEqual(memcpy(b, 1, b, 4, 7), 3);
                test.strictEqual(hex(b), "0189ABCD89ABCDEF");
                fill(b);
                test.strictEqual(memcpy(b, b), 8);
                test.strictEqual(hex(b), "0123456789ABCDEF");
                fill(b);
                test.strictEqual(memcpy(b, b, 4), 4);
                test.strictEqual(hex(b), "89ABCDEF89ABCDEF");
                fill(b);
                test.strictEqual(memcpy(b, 4, b, 0, 4), 4);
                test.strictEqual(hex(b), "0123456701234567");
            });
        });
        test.done();
    },

    "100k": function(test) {
        [memcpy.binding, memcpy.native].forEach(function(memcpy) {
            [Buffer, ArrayBuffer, Uint8Array].forEach(function(Type1) {
                [Buffer, ArrayBuffer, Uint8Array].forEach(function(Type2) {
                    var b1 = new Type1(1024),
                        b2 = new Type2(1024);
                    fill(b1);
                    fill(b2);
                    var t = process.hrtime();
                    for (var i=0; i<100000; ++i) {
                        memcpy(b2, 1, b1, 0, 1023);
                    }
                    t = process.hrtime(t);
                    test.log((memcpy === memcpy.binding ? "cc".cyan : "js".green)+" "+b1.constructor.name+" -> "+b2.constructor.name+": "+((t[0]*1e9+t[1])/1000000).toFixed(3)+"ms");
                });
            });
        });
        test.done();
    }
}