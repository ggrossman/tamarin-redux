/* ***** BEGIN LICENSE BLOCK ***** 
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1 
 *
 * The contents of this file are subject to the Mozilla Public License Version 1.1 (the 
 * "License"); you may not use this file except in compliance with the License. You may obtain 
 * a copy of the License at http://www.mozilla.org/MPL/ 
 * 
 * Software distributed under the License is distributed on an "AS IS" basis, WITHOUT 
 * WARRANTY OF ANY KIND, either express or implied. See the License for the specific 
 * language governing rights and limitations under the License. 
 * 
 * The Original Code is [Open Source Virtual Machine.] 
 * 
 * The Initial Developer of the Original Code is Adobe System Incorporated.  Portions created 
 * by the Initial Developer are Copyright (C)[ 2004-2006 ] Adobe Systems Incorporated. All Rights 
 * Reserved. 
 * 
 * Contributor(s): Adobe AS3 Team
 * 
 * Alternatively, the contents of this file may be used under the terms of either the GNU 
 * General Public License Version 2 or later (the "GPL"), or the GNU Lesser General Public 
 * License Version 2.1 or later (the "LGPL"), in which case the provisions of the GPL or the 
 * LGPL are applicable instead of those above. If you wish to allow use of your version of this 
 * file only under the terms of either the GPL or the LGPL, and not to allow others to use your 
 * version of this file under the terms of the MPL, indicate your decision by deleting provisions 
 * above and replace them with the notice and other provisions required by the GPL or the 
 * LGPL. If you do not delete the provisions above, a recipient may use your version of this file 
 * under the terms of any one of the MPL, the GPL or the LGPL. 
 * 
 ***** END LICENSE BLOCK ***** */


package DynamicClass {

 import DynamicClass.*; 

 class ExtDynamicClassPubStatInner extends DynamicClass {

    // ************************************
    // access public static method of parent
    // from default method of sub class
    // ************************************

    function subGetArray() : Array { return getPubStatArray(); }
    function subSetArray(a:Array) { setPubStatArray(a); }

    public function testSubSetArray(a:Array) : Array {
        this.subSetArray(a);
        return this.subGetArray();
    }


    // ************************************
    // access public static method of parent
    // from public method of sub class
    // ************************************

    public function pubSubGetArray() : Array { return getPubStatArray(); }
    public function pubSubSetArray(a:Array) { setPubStatArray(a); }

    // ************************************
    // access public static method of parent
    // from private method of sub class
    // ************************************

    private function privSubGetArray() : Array { return getPubStatArray(); }
    private function privSubSetArray(a:Array) { setPubStatArray(a); }

    // function to test above from test scripts
    public function testPrivSubArray(a:Array) : Array {
        this.privSubSetArray(a);
        return this.privSubGetArray();
    }

    // ***************************************
    // access public static method of parent
    // from static method of sub class
    // ***************************************

    static function statSubGetArray() : Array { return getPubStatArray(); }
    static function statSubSetArray(a:Array) { setPubStatArray(a); }

    public static function testStatSubSetArray(a:Array) : Array {
        statSubSetArray(a);
        return statSubGetArray();
    }


    // ***************************************
    // access public static method of parent
    // from public static method of sub class
    // ***************************************

    public static function pubStatSubGetArray() : Array { return getPubStatArray(); }
    public static function pubStatSubSetArray(a:Array) { setPubStatArray(a); }

    // ***************************************
    // access public static method of parent
    // from private static method of sub class
    // ***************************************

    private static function privStatSubGetArray() : Array { return getPubStatArray(); }
    private static function privStatSubSetArray(a:Array) { setPubStatArray(a); }

    // public accessor to test asrt
    public function testPrivStatSubArray(a:Array) : Array {
        privStatSubSetArray(a);
        return privStatSubGetArray();
    }

    // ***************************************
    // access public static property from 
    // default method of sub class
    // ***************************************

    function subGetDPArray() : Array { return pubStatArray; }
    function subSetDPArray(a:Array) { pubStatArray = a; }

    public function testSubSetDPArray(a:Array) : Array {
        this.subSetDPArray(a);
        return this.subGetDPArray();
    }


    // ***************************************
    // access public static property from
    // public method of sub class
    // ***************************************

    public function pubSubGetDPArray() : Array { return pubStatArray; }
    public function pubSubSetDPArray(a:Array) { pubStatArray = a; }

    // ***************************************
    // access public static property from
    // private method of sub class
    // ***************************************

    private function privSubGetDPArray() : Array { return pubStatArray; }
    private function privSubSetDPArray(a:Array) { pubStatArray = a; }


    public function testPrivSubSetDPArray(a:Array) : Array {
        this.privSubSetDPArray(a);
        return this.privSubGetDPArray();
    }


    // ***************************************
    // access public static property from
    // static method of sub class
    // ***************************************

    static function statSubGetSPArray() : Array { return pubStatArray; }
    static function statSubSetSPArray(a:Array) { pubStatArray = a; }

    public static function testStatSubSetDPArray(a:Array) : Array {
        statSubSetSPArray(a);
        return statSubGetSPArray();
    }


    // ***************************************
    // access public static property from
    // public static method of sub class
    // ***************************************

    public static function pubStatSubGetSPArray() : Array { return pubStatArray; }
    public static function pubStatSubSetSPArray(a:Array) { pubStatArray = a; }

    // ***************************************
    // access public static property from
    // private static method of sub class
    // ***************************************
   
    private static function privStatSubGetSPArray() : Array { return pubStatArray; }
    private static function privStatSubSetSPArray(a:Array) { pubStatArray = a; }

    // public accessor for asrt
    public function testPrivStatSubPArray(a:Array) : Array {
        privStatSubSetSPArray( a );
        return privStatSubGetSPArray();
    }
 }
public class ExtDynamicClassPubStat extends ExtDynamicClassPubStatInner {
    static function setStatArray(a:Array) { DynamicClassInner.setStatArray(a); }
    static function setStatBoolean( b:Boolean ) { DynamicClassInner.setStatBoolean(b); }
    static function getStatArray() { return DynamicClassInner.getStatArray(); }
    public static function setPubStatArray(a:Array) { DynamicClassInner.setPubStatArray(a); }
    public static function setPubStatBoolean( b:Boolean ) { DynamicClassInner.setPubStatBoolean(b); }
    public static function getPubStatArray() { return DynamicClassInner.getPubStatArray(); }
    public static function testStatSubSetArray(a:Array) : Array { return ExtDynamicClassPubStatInner.testStatSubSetArray(a); }
    public static function pubStatSubGetArray() : Array { return ExtDynamicClassPubStatInner.pubStatSubGetArray(); }
    public static function pubStatSubSetArray(a:Array) { ExtDynamicClassPubStatInner.pubStatSubSetArray(a); }
    public static function testStatSubSetDPArray(a:Array) : Array { return ExtDynamicClassPubStatInner.testStatSubSetDPArray(a); }
    public static function pubStatSubGetSPArray() : Array { return ExtDynamicClassPubStatInner.pubStatSubGetSPArray(); }
    public static function pubStatSubSetSPArray(a:Array) { ExtDynamicClassPubStatInner.pubStatSubSetSPArray(a); }
}

}
