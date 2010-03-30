/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
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
 * The Original Code is JavaScript Engine testing utilities.
 *
 * The Initial Developer of the Original Code is
 * Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): Igor Bukanov  <igor@mir2.org>
 *                 Bob Clary <bob@bclary.com>
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

startTest();

var gTestfile = 'regress-280769-3.js';
//-----------------------------------------------------------------------------
var BUGNUMBER = 280769;
var summary = 'Do not crash on overflow of 64K boundary in number of classes in regexp';
var actual = 'No Crash';
var expect = 'No Crash';

printBugNumber(BUGNUMBER);
printStatus (summary);

var N = 100 * 1000;

status = summary + ' ' + inSection(3) + ' (new RegExp("[0][1]...[99999]").exec("") ';

var a = new Array(N);

for (var i = 0; i != N; ++i) {
  a[i] = i;
}

var str = '['+a.join('][')+']'; // str is [0][1][2]...[<PRINTED N-1>]

try
{
  var re = new RegExp(str);
}
catch(e)
{
  printStatus('Exception creating RegExp: ' + e);
}

try
{
  re.exec('');
}
catch(e)
{
  printStatus('Exception executing RegExp: ' + e);
}

AddTestCase(status, expect, actual);

test();
