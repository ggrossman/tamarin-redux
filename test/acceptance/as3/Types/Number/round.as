/* -*- c-basic-offset: 4; indent-tabs-mode: nil; tab-width: 4 -*- */
/* vi: set ts=4 sw=4 expandtab: (add to ~/.vimrc: set modeline modelines=5) */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is [Open Source Virtual Machine.].
 *
 * The Initial Developer of the Original Code is
 * Adobe System Incorporated.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Adobe AS3 Team
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*
Returns the Number value that is closest to x and is equal to a mathematical
integer. If two integer Number values are equally close to x, then the result
is the Number value that is closer to +Infinity. If x is already an integer,
the result is x.
*/

import avmplus.*;

var SECTION = "15.8.2.15";
var VERSION = "AS3";
var TITLE   = "public native static function round (x:Number) :Number;";

startTest();
writeHeaderToLog( SECTION + " "+ TITLE);

function check(param:Number):Number { return Number.round(param); }

AddTestCase("Number.round() returns a int", "int", getQualifiedClassName(Number.round(12.345)));
AddTestCase("Number.round() length is 1", 1, Number.round.length);
AddErrorTest("Number.round() with no args", ARGUMENTERROR+1063,  function(){ Number.round(); });

// If x is NaN, the result is NaN.
AddTestCase("Number.round(undefined)", NaN, Number.round(undefined));
AddTestCase("Number.round(string)", NaN, Number.round("string"));
AddTestCase("Number.round(NaN)", NaN, Number.round(NaN));
AddTestCase("Number.round(NaN) check()", NaN, check(NaN));

// If x is +0, the result is +0.
AddTestCase("Number.round(0)", 0, Number.round(0));
AddTestCase("Number.round(0) is +0", Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY/Number.round(0));
AddTestCase("Number.round(0) check()", 0, check(0));
AddTestCase("Number.round(0) is +0 check()", Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY/check(0));
AddTestCase("Number.round(null)", 0, Number.round(null));
AddTestCase("Number.round(false)", 0, Number.round(false));

// If x is -0, the result is -0.
AddTestCase("Number.round(-0)", -0, Number.round(-0));
AddTestCase("Number.round(-0) sign check", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY/Number.round(-0));
AddTestCase("Number.round(-0) check()", -0, check(-0));
AddTestCase("Number.round(-0) check() sign check", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY/check(-0));

// If x is +Infinity, the result is +Infinity.
AddTestCase("Number.round(Number.POSITIVE_INFINITY)", Number.POSITIVE_INFINITY, Number.round(Number.POSITIVE_INFINITY));
AddTestCase("Number.round(Number.POSITIVE_INFINITY) check()", Number.POSITIVE_INFINITY, check(Number.POSITIVE_INFINITY));

// If x is -Infinity, the result is -Infinity.
AddTestCase("Number.round(Number.NEGATIVE_INFINITY)", Number.NEGATIVE_INFINITY, Number.round(Number.NEGATIVE_INFINITY));
AddTestCase("Number.round(Number.NEGATIVE_INFINITY) check()", Number.NEGATIVE_INFINITY, check(Number.NEGATIVE_INFINITY));

// If x is greater than 0 but less than 0.5, the result is +0.
AddTestCase("Number.round(0.49)", 0, Number.round(0.49));
AddTestCase("Number.round(0.49999)", 0, Number.round(0.49999));
AddTestCase("Number.round(49.999e-2)", 0, Number.round(49.999e-2));
AddTestCase("Number.round(0.49) check()", 0, check(0.49));
AddTestCase("Number.round(49.999e-2) check()", 0, check(49.999e-2));
AddTestCase("Number.round(Number.MIN_VALUE)", 0, Number.round(Number.MIN_VALUE));

// If x is less than 0 but greater than or equal to -0.5, the result is -0.
AddTestCase("Number.round(-0.49)", -0, Number.round(-0.49));
AddTestCase("Number.round(-0.49) sign check", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY/Number.round(-0.49));
AddTestCase("Number.round(-0.49) check()", -0, check(-0.49));
AddTestCase("Number.round(-0.49) check() sign check", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY/check(-0.49));
AddTestCase("Number.round(-0.49999)", -0, Number.round(-0.49999));
AddTestCase("Number.round(-0.49999) sign check", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY/Number.round(-0.49999));
AddTestCase("Number.round(-4.9999e-1)", -0, Number.round(-4.9999e-1));
AddTestCase("Number.round(-4.9999e-1) sign check", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY/Number.round(4.9999e-1));
AddTestCase("Number.round(-Number.MIN_VALUE)", -0, Number.round(-Number.MIN_VALUE));
AddTestCase("Number.round(-Number.MIN_VALUE) sign check", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY/Number.round(-Number.MIN_VALUE));
AddTestCase("Number.round(-0.5)", -0, Number.round(-0.5));
AddTestCase("Number.round(-0.5) sign check", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY/Number.round(-0.5));

// NOTE 1 Number.round(3.5) returns 4, but Number.round(–3.5) returns –3.
AddTestCase("Number.round(3.5)", 4, Number.round(3.5));
AddTestCase("Number.round(3.5) check()", 4, check(3.5));
AddTestCase("Number.round(-3.5)", -3, Number.round(-3.5));
AddTestCase("Number.round(-3.5) check()", -3, check(-3.5));

// NOTE 2 The value of Math.round(x) is the same as the value of Math.floor(x+0.5),
// except when x is -0 or is less than 0 but greater than or equal to -0.5; for these
// cases Math.round(x) returns -0, but Math.floor(x+0.5) returns +0.
var x = 5.26;
AddTestCase("x=5.26 Number.round(x) == Number.floor(x+0.5)", Number.floor(x+0.5), Number.round(x));
x = -0;
var resRound = Number.POSITIVE_INFINITY/Number.round(x);
var resFloor = Number.POSITIVE_INFINITY/Number.floor(x+0.5);
AddTestCase("x=-0 Number.round(x) != Number.floor(x+0.5)", true, resRound != resFloor);
x = -0.49;
var resRound = Number.POSITIVE_INFINITY/Number.round(x);
var resFloor = Number.POSITIVE_INFINITY/Number.floor(x+0.5);
AddTestCase("x=-0.49 Number.round(x) != Number.floor(x+0.5)", true, resRound != resFloor);



AddTestCase("Number.round(-5.000001e-1)", -1, Number.round(-5.000001e-1));
AddTestCase("Number.round(true)", 1, Number.round(true));
AddTestCase("Number.round(0.5)", 1, Number.round(0.5));
AddTestCase("Number.round(5.000001e-1)", 1, Number.round(5.000001e-1));

var myNum:Number = 3.124;
AddTestCase("Number.round(3.124)", 3, Number.round(myNum));
AddTestCase("Number.round(3.124) NumberLiteral", 3, Number.round(3.124));

AddTestCase("Number.round(Number.MAX_VALUE)", Number.MAX_VALUE, Number.round(Number.MAX_VALUE));


test();

