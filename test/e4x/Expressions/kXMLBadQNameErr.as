/* -*- Mode: java; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * The contents of this file are subject to the Netscape Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/NPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *
 * The Original Code is Rhino code, released
 * May 6, 1999.
 *
 * The Initial Developer of the Original Code is Netscape
 * Communications Corporation.  Portions created by Netscape are
 * Copyright (C) 1997-2000 Netscape Communications Corporation. All
 * Rights Reserved.
 *
 * Contributor(s):
 * Igor Bukanov
 * Ethan Hugg
 * Milen Nankov
 *
 * Alternatively, the contents of this file may be used under the
 * terms of the GNU Public License (the "GPL"), in which case the
 * provisions of the GPL are applicable instead of those above.
 * If you wish to allow use of your version of this file only
 * under the terms of the GPL and not to allow others to use your
 * version of this file under the NPL, indicate your decision by
 * deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL.  If you do not delete
 * the provisions above, a recipient may use your version of this
 * file under either the NPL or the GPL.
 */

START("11.1.2 Qualified Identifiers - XML bad QName error");

var expected, result, expectedStr;

expectedStr = "TypeError: Error #1084: Element or attribute (\":x\") do not match QName production: QName::=(NCName':')?NCName";
expected = "Error #1084";

result = "error, exception not thrown";

namespace ns="http://www.foo.com";
var x1 = new XML("<x xmlns='http://www.foo.com'><a>foo</a></x>"); 

try{

x1 = new XML("<:x>hi</x>");
throw "kXMLBadQname error not thrown";

} catch( e1 ){

result = grabError(e1, e1.toString());

}


AddTestCase("<:x>hi</x>", expected, result);


expectedStr = "TypeError: Error #1084: Element or attribute (\":ns\") do not match QName production: QName::=(NCName':')?NCName";
expected = "Error #1084";

try{

x1 = new XML("<x :ns='attr'>hi</x>");
throw "kXMLBadQname error not thrown";

} catch( e2 ){

result = grabError(e2, e2.toString());

}


AddTestCase("<x :ns='attr'>hi</x>", expected, result);

END();

