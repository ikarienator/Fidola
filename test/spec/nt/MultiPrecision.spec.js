describe("Multi-precision arithmetics", function () {
    var nt = fidola.nt;
    describe("Big Integers", function () {
        var Integer = nt.Integer;
        var Unsigned = nt.Unsigned;
        var int = Integer.from;
        var uint = Unsigned.from;
        var a, b, c;
        var f100 = '93326215443944152681699238856266700490715968264381621468592963895217599993229915608941463976156518286253697920827223758251185210916864000000000000000000000000';
        var f100_t_2 = '186652430887888305363398477712533400981431936528763242937185927790435199986459831217882927952313036572507395841654447516502370421833728000000000000000000000000';
        it("Constructor", function () {
            expect(Integer.fromNumber(-1).toString()).to.eql('-1');
            expect(new Integer(int(-6)).toString()).to.eql('-6');
            expect(new Integer([]).toString()).to.eql('0');
            expect(new Integer([0, 0, 0, 0, 0]).toString()).to.eql('0');
            expect(new Integer([123456789]).toString()).to.eql('123456789');
            expect(Integer.from(new nt.Unsigned.fromNumber(1)).toString()).to.eql('1');
            expect(Unsigned.from(int(1)).toString()).to.eql(1);
            expect(function () {
                uint(-1).toString();
            }).throwError();
            expect(function () {
                uint(int(-1)).toString();
            }).throwError();
            expect(function () {
                uint('-1').toString();
            }).throwError();
            expect(int('-1').toString()).to.eql('-1');
            expect(function () {
                uint('-123-456').toString();
            }).throwError();
            expect(function () {
                uint('-1230456').toString();
            }).throwError();
            expect(int('123456789012').toString()).to.eql('123456789012');
            expect(int('123456789012').getDigits(32)).to.eql([20, 16, 6, 18, 9, 31, 18, 3]);
            expect(int('123456789012').getDigits(8)).to.eql([4, 2, 0, 5, 1, 2, 6, 4, 6, 7, 2, 6, 1]);
            expect(int('123456789012').getDigits(2)).to.eql([0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0,
                1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1]);
            expect(int('123456789012').getDigits(32768)).to.eql([6676, 32050, 114]);
            expect(int('123456789012').getDigits(32768)).to.eql([6676, 32050, 114]);
            expect(int(f100).toString()).to.eql(f100);
            expect(int('-' + f100).toString()).to.eql('-' + f100);
            expect(int('-0').toString()).to.eql('0');
        });

        it("Basics", function () {
            expect(int(3).isEven()).to.eql(false);
            expect(int(-3).isEven()).to.eql(false);
            expect(int(4).isEven()).to.eql(true);
            expect(int(-4).isEven()).to.eql(true);
            expect(int(0).isEven()).to.eql(true);
            expect(int(0).isEven()).to.eql(true);

            expect(int(3).isOdd()).to.eql(true);
            expect(int(-3).isOdd()).to.eql(true);
            expect(int(4).isOdd()).to.eql(false);
            expect(int(-4).isOdd()).to.eql(false);
            expect(int(0).isOdd()).to.eql(false);
            expect(int(0).isOdd()).to.eql(false);

            expect(int(7).shiftLeft(1).toString()).to.eql('14');
            expect(int(2).shiftLeft(14).toString()).to.eql('32768');
            expect(int(-1).shiftLeft(300).toString()).to.eql('-2037035976334486086268445688409378161051468393665936250636140449354381299763336706183397376');
        });

        it("Compare", function () {
            expect(int(3).cmp(3)).to.eql(0);
            expect(int(-3).cmp(-3)).to.eql(0);
            expect(int(0).cmp(0)).to.eql(0);
            expect(int(3).cmp(0)).to.eql(1);
            expect(int(-3).cmp(0)).to.eql(-1);
            expect(int(0).cmp(3)).to.eql(-1);
            expect(int(0).cmp(-3)).to.eql(1);

            expect(int(3).cmp(1)).to.eql(1);
            expect(int(-3).cmp(1)).to.eql(-1);
            expect(int(1).cmp(3)).to.eql(-1);
            expect(int(1).cmp(-3)).to.eql(1);
        });

        it("Plus", function () {
            expect(int(3).plus(5).toString()).to.eql('8');
            expect(int(3).plus(-5).toString()).to.eql('-2');
            expect(int(-3).plus(5).toString()).to.eql('2');
            expect(int(-3).plus(-5).toString()).to.eql('-8');

            expect(int(-5).plusAssign(-3).toString()).to.eql('-8');
            expect(uint(5).plusAssign(3).toString()).to.eql('8');

            a = int(f100);
            a = a.plus(a);
            // expect(a.toString()).to.eql(f100_t_2);
            expect(a.plus(int('0')).toString()).to.eql(f100_t_2);
            expect(int('0').plus(a).toString()).to.eql(f100_t_2);

            a = int('-' + f100);
            b = int(f100);
            expect(a.minus(b).toString()).to.eql('-' + f100_t_2);


            expect(int(1073741823).plus(1).toString()).to.eql('1073741824');
        });

        it("Minus", function () {
            expect(int(3).minus(5).toString()).to.eql('-2');
            expect(int(3).minus(-5).toString()).to.eql('8');
            expect(int(-3).minus(5).toString()).to.eql('-8');
            expect(int(-3).minus(-5).toString()).to.eql('2');

            expect(int(5).minus(3).toString()).to.eql('2');
            expect(int(5).minus(-3).toString()).to.eql('8');
            expect(int(-5).minus(3).toString()).to.eql('-8');
            expect(int(-5).minus(-3).toString()).to.eql('-2');

            expect(int(-5).minusAssign(-3).toString()).to.eql('-2');
            expect(uint(5).minusAssign(3).toString()).to.eql('2');

            a = int(f100);
            a = a.minus(a);
            expect(a.toString()).to.eql("0");

            a = int('-' + f100);
            b = int(f100);
            expect(a.plus(b).toString()).to.eql('0');

            a = int('59649589127497217');
            b = int('5704689200685129054721');
            expect(a.minus(b).toString()).to.eql('-5704629551096001557504');

            a = int('5704689200685129054721');
            b = int('59649589127497217');
            expect(a.minus(b).toString()).to.eql('5704629551096001557504');
        });

        it("Mult", function () {
            a = int('0');
            b = int('5704689200685129054721');
            expect(a.multAssign(b).toString()).to.eql('0');

            a = uint('5704689200685129054721');
            b = uint('0');
            expect(a.multAssign(b).toString()).to.eql('0');

            b = uint('5704689200685129054721');
            a = uint('0');
            expect(a.multAssign(b).toString()).to.eql('0');

            a = uint('59649589127497217');
            expect(a.multAssign(0).toString()).to.eql('0');

            a = uint('59649589127497217');
            expect(a.multAssign(2).toString()).to.eql('119299178254994434');

            a = int('59649589127497217');
            b = int('5704689200685129054721');
            expect(a.mult(b).toString()).to.eql('340282366920938463463374607431768211457');

            a = int('59649589127497217');
            b = int('-5704689200685129054721');
            expect(a.mult(b).toString()).to.eql('-340282366920938463463374607431768211457');

            a = int('45592577');
            a.multAssign(int('6487031809'));

            a.multAssign(int('4659775785220018543264560743076778192897'));
            a.multAssign(int('130439874405488189727484768796509903946608530841611892186895295776832416251471863574140227977573104895898783928842923844831149032913798729088601617946094119449010595906710130531906171018354491609619193912488538116080712299672322806217820753127014424577'));
            expect(a.toString()).to.eql('179769313486231590772930519078902473361797697894230657273430081157732675805500963132708477322407536021120113879871393357658789768814416622492847430639474124377767893424865485276302219601246094119453082952085005768838150682342462881473913110540827237163350510684586298239947245938479716304835356329624224137217');

            var intstr = '1', result = '1';
            for (var i = 0; i < 6000; i++) {
                intstr += '0';
                result += '00';
            }
            expect(int(intstr).mult(intstr).toString()).to.eql(result);
            intstr += '0';
            result += '00';
            a = int(intstr);
            expect(a.multAssign(a).toString()).to.eql(result);
        });

        it("Div", function () {
            expect(function () {
                uint(1).divMod('0');
            }).throwError();
            expect(function () {
                uint(1).divMod(0);
            }).throwError();
            expect(uint(1).divMod(1).join(':')).to.eql('1:0');
            expect(uint(1).divMod(32768).join(':')).to.eql('0:1');
            expect(int(7).divMod(1).map(function (x) {
                return x.toString();
            })).to.eql(['7', '0']);
            expect(int(7).divMod(-1).map(function (x) {
                return x.toString();
            })).to.eql(['-7', '0']);
            expect(int(-7).divMod(1).map(function (x) {
                return x.toString();
            })).to.eql(['-7', '0']);
            expect(int(-7).divMod(-1).map(function (x) {
                return x.toString();
            })).to.eql(['7', '0']);
            expect(int(7).divMod(3).map(function (x) {
                return x.toString();
            })).to.eql(['2', '1']);
            expect(int(7).divMod(-3).map(function (x) {
                return x.toString();
            })).to.eql(['-3', '-2']);
            expect(int(-7).divMod(3).map(function (x) {
                return x.toString();
            })).to.eql(['-3', '2']);
            expect(int(-7).divMod(-3).map(function (x) {
                return x.toString();
            })).to.eql(['2', '-1']);
            expect(int(0).divMod(-3).map(function (x) {
                return x.toString();
            })).to.eql(['0', '0']);

            expect(uint('75557863690729951330304').divMod('37778931862957161709567')[0].toString()).to.eql('1');
            expect(uint('99999999999999999999999999999999999999999999').divMod('89')[0].toString()).to.eql('1123595505617977528089887640449438202247191');
            expect(uint('99999999999999999999999999999999999999999999').divMod('89')[1].toString()).to.eql('0');
            expect(uint('89').divMod('99999999999999999999999999999999999999999999')[0].toString()).to.eql('0');
            expect(uint('89').divMod('99999999999999999999999999999999999999999999')[1].toString()).to.eql('89');

            expect(uint('99999999999999999999999999999999999999999999').divMod('99999999999999999999999999999999999999999999')[0].toString()).to.eql('1');
            expect(uint('99999999999999999999999999999999999999999999').divMod('99999999999999999999999999999999999999999999')[1].toString()).to.eql('0');

            var intstr = '', result = '';
            for (var i = 0; i < 10; i++) {
                intstr += '00000000000000000000000000000000000000000089';
                result += '99999999999999999999999999999999999999999999';
            }
            expect(uint(result).divMod(intstr)[0].toString()).to.eql('1123595505617977528089887640449438202247191');

            a = uint(result);
            expect(a.divAssignMod(10).toString()).to.eql('9');
            expect(a.divAssignMod(10).toString()).to.eql('9');
            expect(a.divAssignMod(10).toString()).to.eql('9');
            expect(a.divAssignMod(10).toString()).to.eql('9');
            expect(a.divAssignMod(10).toString()).to.eql('9');
        });
    });
});
