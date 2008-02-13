/* -*- mode: java; tab-width: 4; insert-tabs-mode: nil; indent-tabs-mode: nil -*- */
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
 * Portions created by the Initial Developer are Copyright (C) 2004-2006
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

use namespace intrinsic;

public namespace Lex

{
    use default namespace Lex;

    class Scanner
    {
        var src : String;
        var filename : String;
        var curIndex : int;
        var markIndex : int;
        var lnCoord : int;
        const notPartOfIdent = [];

        function syntaxError(msg) {
            Util::syntaxError(filename, lnCoord, msg);
        }

        function internalError(msg) {
            Util::internalError(filename, lnCoord, msg);
        }

        /* public */
        function Scanner (src:String, filename:String)
            : src = src + "\n"
            , filename = filename
            , curIndex = 0
            , markIndex = 0
            , lnCoord = 1
        {
            // The array notPartOfIdent maps ASCII and Unicode space
            // characters that are not part of an identifier to true.
            // It is used by the scanner to determine whether it has
            // seen a keyword.

            for ( let i=0 ; i < 128 ; i++ ) {
                let c = String.fromCharCode(i);
                if ( c >= "a" && c <= "z" ||
                     c >= "A" && c <= "Z" ||
                     c >= "0" && c <= "9" ||
                     c == "_" || c == "$")
                    continue;
                notPartOfIdent[i] = true;
            }
            notPartOfIdent[0xA0] = true;
            // FIXME: also all unicode space characters go here!
        }

        /* public */
        function regexp () {
            switch (src.charCodeAt(curIndex++)) {
            case  47 /* Char::Slash */ :
                return regexpFlags ();
            case  10 /* Char::Newline */ :
                if (curIndex == src.length)
                    Lex::syntaxError("Unexpected end of program in regexp literal");
            default:
                return regexp ();
            }
        }

        function regexpFlags () {
            if (Char::isIdentifierPart (src.charCodeAt(curIndex))) {
                ++curIndex;
                return regexpFlags ();
            }
            else {
                return Token::makeInstance (Token::RegexpLiteral,lexeme());
            }
        }

        /* public */
        function div () : int {
            switch (src.charCodeAt(curIndex)) {
            case  61 /* Char::Equal */ : 
                curIndex++;
                return Token::DivAssign;
            case  62 /* Char::RightAngle */: 
                curIndex++;
                return Token::XmlTagEndEnd;
            default :
                return Token::Div;
            }
        }

        function lexeme()
            src.slice (markIndex,curIndex)

        /* Get the next token.

           Never returns Token::Eol.

           lnCoord will be the line number of the
           ending character of the token.  This probably only matters
           for strings, and it would be good in that case to have the
           starting position too.  */

        /* public */
        function start () : int {
            while (true) {
            bigswitch:
                switch (src.charCodeAt(curIndex++)) {

                case  10 /* Char::Newline */:
                    if (curIndex === src.length)
                        return Token::EOS;
                    lnCoord++;
                    continue;

                case  13 /* Char::CarriageReturn */: 
                    continue;

                case  32 /* Char::Space */: 
                    continue;

                case   9 /* Char::Tab */: 
                    continue;

                case  40 /* Char::LeftParen */: 
                    return Token::LeftParen;

                case  41 /* Char::RightParen */: 
                    return Token::RightParen;

                case  44 /* Char::Comma */: 
                    return Token::Comma;

                case  59 /* Char::Semicolon */: 
                    return Token::SemiColon;

                case  63 /* Char::QuestionMark */: 
                    return Token::QuestionMark;

                case  91 /* Char::LeftBracket */: 
                    return Token::LeftBracket;

                case  93 /* Char::RightBracket */: 
                    return Token::RightBracket;

                case 123 /* Char::LeftBrace */: 
                    return Token::LeftBrace;

                case 125 /* Char::RightBrace */: 
                    return Token::RightBrace;

                case 126 /* Char::Tilde */: 
                    return Token::BitwiseNot;

                case  64 /* Char::At */: 
                    return Token::At;

                case  47 /* Char::Slash */: 
                    switch (src.charCodeAt(curIndex)) {
                    case 47 /* Char::Slash */:
                        curIndex++;
                        lineComment ();
                        continue;

                    case 42 /* Char::Asterisk */:
                        curIndex++;
                        blockComment();
                        continue;

                    default:
                        markIndex = curIndex-1;
                        return Token::BREAK;
                    }

                case  39 /* Char::SingleQuote */: 
                    return stringLiteral (39);

                case  34 /* Char::DoubleQuote */: 
                    return stringLiteral (34);

                case  46 /* Char::Dot */: 
                    switch (src.charCodeAt(curIndex)) {
                    case  46 /* Char::Dot */:
                        curIndex++;
                        if (src.charCodeAt(curIndex) == 46 /* Char::Dot */) {
                            curIndex++;
                            return Token::TripleDot;
                        }
                        return Token::DoubleDot;

                    case  60 /* Char::LeftAngle */: 
                        curIndex++;
                        return Token::LeftDotAngle;

                    case  48 /* Char::Zero */:
                    case  49 /* Char::One */:
                    case  50 /* Char::Two */:
                    case  51 /* Char::Three */:
                    case  52 /* Char::Four */:
                    case  53 /* Char::Five */:
                    case  54 /* Char::Six */:
                    case  55 /* Char::Seven */:
                    case  56 /* Char::Eight */:
                    case  57 /* Char::Nine */:
                        markIndex = --curIndex;
                        return numberLiteral ();

                    default :
                        return Token::Dot;
                    }

                case  45 /* Char::Dash */: 
                    switch (src.charCodeAt(curIndex)) {
                    case  45 /* Char::Dash */ : 
                        curIndex++;
                        return Token::MinusMinus;

                    case  61 /* Char::Equal */: 
                        curIndex++;
                        return Token::MinusAssign;

                    default :
                        return Token::Minus;
                    }

                case  33 /* Char::Bang */: 
                    if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                        curIndex++;
                        if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                            curIndex++;
                            return Token::StrictNotEqual;
                        }
                        return Token::NotEqual;
                    }
                    return Token::Not;

                case  37 /* Char::Percent */: 
                    if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                        curIndex++;
                        return Token::RemainderAssign;
                    }
                    return Token::Remainder;

                case  38 /* Char::Ampersand */: 
                    switch (src.charCodeAt(curIndex)) {
                    case  61 /* Char::Equal */:
                        curIndex++;
                        return Token::BitwiseAndAssign;

                    case  38 /* Char::Ampersand */:
                        curIndex++;
                        if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                            curIndex++;
                            return Token::LogicalAndAssign;
                        }
                        return Token::LogicalAnd;

                    default:
                        return Token::BitwiseAnd;
                    }

                case  42 /* Char::Asterisk */: 
                    if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                        curIndex++;
                        return Token::MultAssign;
                    }
                    return Token::Mult;

                case  58 /* Char::Colon */: 
                    if (src.charCodeAt(curIndex) == 58 /* Char::Colon */) {
                        curIndex++;
                        return Token::DoubleColon;
                    }
                    return Token::Colon;

                case  94 /* Char::Caret */: 
                    if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                        curIndex++;
                        return Token::BitwiseXorAssign;
                    }
                    return Token::BitwiseXor;

                case 124 /* Char::Bar */: 
                    switch (src.charCodeAt(curIndex)) {
                    case  61 /* Char::Equal */:
                        curIndex++;
                        return Token::BitwiseOrAssign;
                    case 124 /* Char::Bar */:
                        curIndex++;
                        if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                            curIndex++;
                            return Token::LogicalOrAssign;
                        }
                        return Token::LogicalOr;
                    default:
                        return Token::BitwiseOr;
                    }

                case  43 /* Char::Plus */: 
                    switch (src.charCodeAt(curIndex)) {
                    case  43 /* Char::Plus */:
                        curIndex++;
                        return Token::PlusPlus;
                    case  61 /* Char::Equal */:
                        curIndex++;
                        return Token::PlusAssign;
                    default:
                        return Token::Plus;
                    }

                case  60 /* Char::LeftAngle */: 
                    switch (src.charCodeAt(curIndex)) {
                    case  61 /* Char::Equal */:
                        curIndex++;
                        return Token::LessThanOrEqual;
                    case  60 /* Char::LeftAngle */:
                        curIndex++;
                        if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                            curIndex++;
                            return Token::LeftShiftAssign;
                        }
                        return Token::LeftShift;
                    case  47 /* Char::Slash */:
                        curIndex++;
                        return Token::XmlTagStartEnd;
                    default:
                        return Token::LessThan;
                    }
                    return leftAngle ();

                case  61 /* Char::Equal */: 
                    if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                        curIndex++;
                        if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                            curIndex++;
                            return Token::StrictEqual;
                        }
                        return Token::Equal;
                    }
                    return Token::Assign;

                case  62 /* Char::RightAngle */: 
                    switch (src.charCodeAt(curIndex)) {
                    case  61 /* Char::Equal */:
                        curIndex++;
                        return Token::GreaterThanOrEqual;
                    case  62 /* Char::RightAngle */:
                        curIndex++;
                        switch (src.charCodeAt(curIndex)) {
                        case  61 /* Char::Equal */:
                            curIndex++;
                            return Token::RightShiftAssign;
                        case  62 /* Char::RightAngle */:
                            curIndex++;
                            if (src.charCodeAt(curIndex) == 61 /* Char::Equal */) {
                                curIndex++;
                                return Token::UnsignedRightShiftAssign;
                            }
                            return Token::UnsignedRightShift;
                        default:
                            return Token::RightShift;
                        }
                    default:
                        return Token::GreaterThan;
                    }

                // Begin generated code

                case 98: /* Char::b */
                    if (src.charCodeAt(curIndex+0) == 114 /* Char::r */ &&
                        src.charCodeAt(curIndex+1) == 101 /* Char::e */ &&
                        src.charCodeAt(curIndex+2) == 97 /* Char::a */ &&
                        src.charCodeAt(curIndex+3) == 107 /* Char::k */ &&
                        notPartOfIdent[src.charCodeAt(curIndex+4)]) {
                        curIndex += 4;
                        return Token::Break;
                    }
                    break bigswitch;
                case 99: /* Char::c */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 97: /* Char::a */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 108: /* Char::l */
                            if (src.charCodeAt(curIndex+2) == 108 /* Char::l */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                                curIndex += 3;
                                return Token::Call;
                            }
                            break bigswitch;
                        case 115: /* Char::s */
                            switch(src.charCodeAt(curIndex+2)) {
                            case 101: /* Char::e */
                                if (!(notPartOfIdent[src.charCodeAt(curIndex+3)])) 
                                    break bigswitch;
                                curIndex += 3;
                                return Token::Case;
                            case 116: /* Char::t */
                                if (!(notPartOfIdent[src.charCodeAt(curIndex+3)])) 
                                    break bigswitch;
                                curIndex += 3;
                                return Token::Cast;
                            default:
                                break bigswitch;
                            }
                        case 116: /* Char::t */
                            if (src.charCodeAt(curIndex+2) == 99 /* Char::c */ &&
                                src.charCodeAt(curIndex+3) == 104 /* Char::h */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+4)]) {
                                curIndex += 4;
                                return Token::Catch;
                            }
                            break bigswitch;
                        default:
                            break bigswitch;
                        }
                    case 108: /* Char::l */
                        if (src.charCodeAt(curIndex+1) == 97 /* Char::a */ &&
                            src.charCodeAt(curIndex+2) == 115 /* Char::s */ &&
                            src.charCodeAt(curIndex+3) == 115 /* Char::s */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+4)]) {
                            curIndex += 4;
                            return Token::Class;
                        }
                        break bigswitch;
                    case 111: /* Char::o */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 110: /* Char::n */
                            switch(src.charCodeAt(curIndex+2)) {
                            case 115: /* Char::s */
                                if (src.charCodeAt(curIndex+3) == 116 /* Char::t */ &&
                                    notPartOfIdent[src.charCodeAt(curIndex+4)]) {
                                    curIndex += 4;
                                    return Token::Const;
                                }
                                break bigswitch;
                            case 116: /* Char::t */
                                if (src.charCodeAt(curIndex+3) == 105 /* Char::i */ &&
                                    src.charCodeAt(curIndex+4) == 110 /* Char::n */ &&
                                    src.charCodeAt(curIndex+5) == 117 /* Char::u */ &&
                                    src.charCodeAt(curIndex+6) == 101 /* Char::e */ &&
                                    notPartOfIdent[src.charCodeAt(curIndex+7)]) {
                                    curIndex += 7;
                                    return Token::Continue;
                                }
                                break bigswitch;
                            default:
                                break bigswitch;
                            }
                        default:
                            break bigswitch;
                        }
                    default:
                        break bigswitch;
                    }
                case 100: /* Char::d */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 101: /* Char::e */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 99: /* Char::c */
                            if (src.charCodeAt(curIndex+2) == 105 /* Char::i */ &&
                                src.charCodeAt(curIndex+3) == 109 /* Char::m */ &&
                                src.charCodeAt(curIndex+4) == 97 /* Char::a */ &&
                                src.charCodeAt(curIndex+5) == 108 /* Char::l */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+6)]) {
                                curIndex += 6;
                                return Token::Decimal;
                            }
                            break bigswitch;
                        case 102: /* Char::f */
                            if (src.charCodeAt(curIndex+2) == 97 /* Char::a */ &&
                                src.charCodeAt(curIndex+3) == 117 /* Char::u */ &&
                                src.charCodeAt(curIndex+4) == 108 /* Char::l */ &&
                                src.charCodeAt(curIndex+5) == 116 /* Char::t */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+6)]) {
                                curIndex += 6;
                                return Token::Default;
                            }
                            break bigswitch;
                        case 108: /* Char::l */
                            if (src.charCodeAt(curIndex+2) == 101 /* Char::e */ &&
                                src.charCodeAt(curIndex+3) == 116 /* Char::t */ &&
                                src.charCodeAt(curIndex+4) == 101 /* Char::e */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+5)]) {
                                curIndex += 5;
                                return Token::Delete;
                            }
                            break bigswitch;
                        default:
                            break bigswitch;
                        }
                    case 111: /* Char::o */
                        if (src.charCodeAt(curIndex+1) == 117 /* Char::u */ &&
                            src.charCodeAt(curIndex+2) == 98 /* Char::b */ &&
                            src.charCodeAt(curIndex+3) == 108 /* Char::l */ &&
                            src.charCodeAt(curIndex+4) == 101 /* Char::e */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+5)]) {
                            curIndex += 5;
                            return Token::Double;
                        }
                        if (!(notPartOfIdent[src.charCodeAt(curIndex+1)])) 
                            break bigswitch;
                        curIndex += 1;
                        return Token::Do;
                    case 121: /* Char::y */
                        if (src.charCodeAt(curIndex+1) == 110 /* Char::n */ &&
                            src.charCodeAt(curIndex+2) == 97 /* Char::a */ &&
                            src.charCodeAt(curIndex+3) == 109 /* Char::m */ &&
                            src.charCodeAt(curIndex+4) == 105 /* Char::i */ &&
                            src.charCodeAt(curIndex+5) == 99 /* Char::c */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+6)]) {
                            curIndex += 6;
                            return Token::Dynamic;
                        }
                        break bigswitch;
                    default:
                        break bigswitch;
                    }
                case 101: /* Char::e */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 97: /* Char::a */
                        if (src.charCodeAt(curIndex+1) == 99 /* Char::c */ &&
                            src.charCodeAt(curIndex+2) == 104 /* Char::h */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                            curIndex += 3;
                            return Token::Each;
                        }
                        break bigswitch;
                    case 108: /* Char::l */
                        if (src.charCodeAt(curIndex+1) == 115 /* Char::s */ &&
                            src.charCodeAt(curIndex+2) == 101 /* Char::e */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                            curIndex += 3;
                            return Token::Else;
                        }
                        break bigswitch;
                    case 110: /* Char::n */
                        if (src.charCodeAt(curIndex+1) == 117 /* Char::u */ &&
                            src.charCodeAt(curIndex+2) == 109 /* Char::m */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                            curIndex += 3;
                            return Token::Enum;
                        }
                        break bigswitch;
                    case 118: /* Char::v */
                        if (src.charCodeAt(curIndex+1) == 97 /* Char::a */ &&
                            src.charCodeAt(curIndex+2) == 108 /* Char::l */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                            curIndex += 3;
                            return Token::Eval;
                        }
                        break bigswitch;
                    case 120: /* Char::x */
                        if (src.charCodeAt(curIndex+1) == 116 /* Char::t */ &&
                            src.charCodeAt(curIndex+2) == 101 /* Char::e */ &&
                            src.charCodeAt(curIndex+3) == 110 /* Char::n */ &&
                            src.charCodeAt(curIndex+4) == 100 /* Char::d */ &&
                            src.charCodeAt(curIndex+5) == 115 /* Char::s */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+6)]) {
                            curIndex += 6;
                            return Token::Extends;
                        }
                        break bigswitch;
                    default:
                        break bigswitch;
                    }
                case 102: /* Char::f */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 97: /* Char::a */
                        if (src.charCodeAt(curIndex+1) == 108 /* Char::l */ &&
                            src.charCodeAt(curIndex+2) == 115 /* Char::s */ &&
                            src.charCodeAt(curIndex+3) == 101 /* Char::e */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+4)]) {
                            curIndex += 4;
                            return Token::False;
                        }
                        break bigswitch;
                    case 105: /* Char::i */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 110: /* Char::n */
                            switch(src.charCodeAt(curIndex+2)) {
                            case 97: /* Char::a */
                                switch(src.charCodeAt(curIndex+3)) {
                                case 108: /* Char::l */
                                    if (src.charCodeAt(curIndex+4) == 108 /* Char::l */ &&
                                        src.charCodeAt(curIndex+5) == 121 /* Char::y */ &&
                                        notPartOfIdent[src.charCodeAt(curIndex+6)]) {
                                        curIndex += 6;
                                        return Token::Finally;
                                    }
                                    if (!(notPartOfIdent[src.charCodeAt(curIndex+4)])) 
                                        break bigswitch;
                                    curIndex += 4;
                                    return Token::Final;
                                default:
                                    break bigswitch;
                                }
                            default:
                                break bigswitch;
                            }
                        default:
                            break bigswitch;
                        }
                    case 111: /* Char::o */
                        if (src.charCodeAt(curIndex+1) == 114 /* Char::r */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+2)]) {
                            curIndex += 2;
                            return Token::For;
                        }
                        break bigswitch;
                    case 117: /* Char::u */
                        if (src.charCodeAt(curIndex+1) == 110 /* Char::n */ &&
                            src.charCodeAt(curIndex+2) == 99 /* Char::c */ &&
                            src.charCodeAt(curIndex+3) == 116 /* Char::t */ &&
                            src.charCodeAt(curIndex+4) == 105 /* Char::i */ &&
                            src.charCodeAt(curIndex+5) == 111 /* Char::o */ &&
                            src.charCodeAt(curIndex+6) == 110 /* Char::n */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+7)]) {
                            curIndex += 7;
                            return Token::Function;
                        }
                        break bigswitch;
                    default:
                        break bigswitch;
                    }
                case 103: /* Char::g */
                    if (src.charCodeAt(curIndex+0) == 101 /* Char::e */ &&
                        src.charCodeAt(curIndex+1) == 116 /* Char::t */ &&
                        notPartOfIdent[src.charCodeAt(curIndex+2)]) {
                        curIndex += 2;
                        return Token::Get;
                    }
                    break bigswitch;
                case 104: /* Char::h */
                    if (src.charCodeAt(curIndex+0) == 97 /* Char::a */ &&
                        src.charCodeAt(curIndex+1) == 115 /* Char::s */ &&
                        notPartOfIdent[src.charCodeAt(curIndex+2)]) {
                        curIndex += 2;
                        return Token::Has;
                    }
                    break bigswitch;
                case 105: /* Char::i */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 102: /* Char::f */
                        if (!(notPartOfIdent[src.charCodeAt(curIndex+1)])) 
                            break bigswitch;
                        curIndex += 1;
                        return Token::If;
                    case 109: /* Char::m */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 112: /* Char::p */
                            switch(src.charCodeAt(curIndex+2)) {
                            case 108: /* Char::l */
                                if (src.charCodeAt(curIndex+3) == 101 /* Char::e */ &&
                                    src.charCodeAt(curIndex+4) == 109 /* Char::m */ &&
                                    src.charCodeAt(curIndex+5) == 101 /* Char::e */ &&
                                    src.charCodeAt(curIndex+6) == 110 /* Char::n */ &&
                                    src.charCodeAt(curIndex+7) == 116 /* Char::t */ &&
                                    src.charCodeAt(curIndex+8) == 115 /* Char::s */ &&
                                    notPartOfIdent[src.charCodeAt(curIndex+9)]) {
                                    curIndex += 9;
                                    return Token::Implements;
                                }
                                break bigswitch;
                            case 111: /* Char::o */
                                if (src.charCodeAt(curIndex+3) == 114 /* Char::r */ &&
                                    src.charCodeAt(curIndex+4) == 116 /* Char::t */ &&
                                    notPartOfIdent[src.charCodeAt(curIndex+5)]) {
                                    curIndex += 5;
                                    return Token::Import;
                                }
                                break bigswitch;
                            default:
                                break bigswitch;
                            }
                        default:
                            break bigswitch;
                        }
                    case 110: /* Char::n */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 115: /* Char::s */
                            if (src.charCodeAt(curIndex+2) == 116 /* Char::t */ &&
                                src.charCodeAt(curIndex+3) == 97 /* Char::a */ &&
                                src.charCodeAt(curIndex+4) == 110 /* Char::n */ &&
                                src.charCodeAt(curIndex+5) == 99 /* Char::c */ &&
                                src.charCodeAt(curIndex+6) == 101 /* Char::e */ &&
                                src.charCodeAt(curIndex+7) == 111 /* Char::o */ &&
                                src.charCodeAt(curIndex+8) == 102 /* Char::f */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+9)]) {
                                curIndex += 9;
                                return Token::InstanceOf;
                            }
                            break bigswitch;
                        case 116: /* Char::t */
                            switch(src.charCodeAt(curIndex+2)) {
                            case 101: /* Char::e */
                                switch(src.charCodeAt(curIndex+3)) {
                                case 114: /* Char::r */
                                    switch(src.charCodeAt(curIndex+4)) {
                                    case 102: /* Char::f */
                                        if (src.charCodeAt(curIndex+5) == 97 /* Char::a */ &&
                                            src.charCodeAt(curIndex+6) == 99 /* Char::c */ &&
                                            src.charCodeAt(curIndex+7) == 101 /* Char::e */ &&
                                            notPartOfIdent[src.charCodeAt(curIndex+8)]) {
                                            curIndex += 8;
                                            return Token::Interface;
                                        }
                                        break bigswitch;
                                    case 110: /* Char::n */
                                        if (src.charCodeAt(curIndex+5) == 97 /* Char::a */ &&
                                            src.charCodeAt(curIndex+6) == 108 /* Char::l */ &&
                                            notPartOfIdent[src.charCodeAt(curIndex+7)]) {
                                            curIndex += 7;
                                            return Token::Internal;
                                        }
                                        break bigswitch;
                                    default:
                                        break bigswitch;
                                    }
                                default:
                                    break bigswitch;
                                }
                            case 114: /* Char::r */
                                if (src.charCodeAt(curIndex+3) == 105 /* Char::i */ &&
                                    src.charCodeAt(curIndex+4) == 110 /* Char::n */ &&
                                    src.charCodeAt(curIndex+5) == 115 /* Char::s */ &&
                                    src.charCodeAt(curIndex+6) == 105 /* Char::i */ &&
                                    src.charCodeAt(curIndex+7) == 99 /* Char::c */ &&
                                    notPartOfIdent[src.charCodeAt(curIndex+8)]) {
                                    curIndex += 8;
                                    return Token::Intrinsic;
                                }
                                break bigswitch;
                            default:
                                if (!(notPartOfIdent[src.charCodeAt(curIndex+2)])) 
                                    break bigswitch;
                                curIndex += 2;
                                return Token::Int;
                            }
                        default:
                            if (!(notPartOfIdent[src.charCodeAt(curIndex+1)])) 
                                break bigswitch;
                            curIndex += 1;
                            return Token::In;
                        }
                    case 115: /* Char::s */
                        if (!(notPartOfIdent[src.charCodeAt(curIndex+1)])) 
                            break bigswitch;
                        curIndex += 1;
                        return Token::Is;
                    default:
                        break bigswitch;
                    }
                case 108: /* Char::l */
                    if (src.charCodeAt(curIndex+0) == 101 /* Char::e */ &&
                        src.charCodeAt(curIndex+1) == 116 /* Char::t */ &&
                        notPartOfIdent[src.charCodeAt(curIndex+2)]) {
                        curIndex += 2;
                        return Token::Let;
                    }
                    break bigswitch;
                case 110: /* Char::n */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 97: /* Char::a */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 109: /* Char::m */
                            if (src.charCodeAt(curIndex+2) == 101 /* Char::e */ &&
                                src.charCodeAt(curIndex+3) == 115 /* Char::s */ &&
                                src.charCodeAt(curIndex+4) == 112 /* Char::p */ &&
                                src.charCodeAt(curIndex+5) == 97 /* Char::a */ &&
                                src.charCodeAt(curIndex+6) == 99 /* Char::c */ &&
                                src.charCodeAt(curIndex+7) == 101 /* Char::e */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+8)]) {
                                curIndex += 8;
                                return Token::Namespace;
                            }
                            break bigswitch;
                        case 116: /* Char::t */
                            if (src.charCodeAt(curIndex+2) == 105 /* Char::i */ &&
                                src.charCodeAt(curIndex+3) == 118 /* Char::v */ &&
                                src.charCodeAt(curIndex+4) == 101 /* Char::e */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+5)]) {
                                curIndex += 5;
                                return Token::Native;
                            }
                            break bigswitch;
                        default:
                            break bigswitch;
                        }
                    case 101: /* Char::e */
                        if (src.charCodeAt(curIndex+1) == 119 /* Char::w */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+2)]) {
                            curIndex += 2;
                            return Token::New;
                        }
                        break bigswitch;
                    case 117: /* Char::u */
                        if (src.charCodeAt(curIndex+1) == 108 /* Char::l */ &&
                            src.charCodeAt(curIndex+2) == 108 /* Char::l */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                            curIndex += 3;
                            return Token::Null;
                        }
                        break bigswitch;
                    default:
                        break bigswitch;
                    }
                case 111: /* Char::o */
                    if (src.charCodeAt(curIndex+0) == 118 /* Char::v */ &&
                        src.charCodeAt(curIndex+1) == 101 /* Char::e */ &&
                        src.charCodeAt(curIndex+2) == 114 /* Char::r */ &&
                        src.charCodeAt(curIndex+3) == 114 /* Char::r */ &&
                        src.charCodeAt(curIndex+4) == 105 /* Char::i */ &&
                        src.charCodeAt(curIndex+5) == 100 /* Char::d */ &&
                        src.charCodeAt(curIndex+6) == 101 /* Char::e */ &&
                        notPartOfIdent[src.charCodeAt(curIndex+7)]) {
                        curIndex += 7;
                        return Token::Override;
                    }
                    break bigswitch;
                case 112: /* Char::p */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 97: /* Char::a */
                        if (src.charCodeAt(curIndex+1) == 99 /* Char::c */ &&
                            src.charCodeAt(curIndex+2) == 107 /* Char::k */ &&
                            src.charCodeAt(curIndex+3) == 97 /* Char::a */ &&
                            src.charCodeAt(curIndex+4) == 103 /* Char::g */ &&
                            src.charCodeAt(curIndex+5) == 101 /* Char::e */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+6)]) {
                            curIndex += 6;
                            return Token::Package;
                        }
                        break bigswitch;
                    case 114: /* Char::r */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 101: /* Char::e */
                            if (src.charCodeAt(curIndex+2) == 99 /* Char::c */ &&
                                src.charCodeAt(curIndex+3) == 105 /* Char::i */ &&
                                src.charCodeAt(curIndex+4) == 115 /* Char::s */ &&
                                src.charCodeAt(curIndex+5) == 105 /* Char::i */ &&
                                src.charCodeAt(curIndex+6) == 111 /* Char::o */ &&
                                src.charCodeAt(curIndex+7) == 110 /* Char::n */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+8)]) {
                                curIndex += 8;
                                return Token::Precision;
                            }
                            break bigswitch;
                        case 105: /* Char::i */
                            if (src.charCodeAt(curIndex+2) == 118 /* Char::v */ &&
                                src.charCodeAt(curIndex+3) == 97 /* Char::a */ &&
                                src.charCodeAt(curIndex+4) == 116 /* Char::t */ &&
                                src.charCodeAt(curIndex+5) == 101 /* Char::e */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+6)]) {
                                curIndex += 6;
                                return Token::Private;
                            }
                            break bigswitch;
                        case 111: /* Char::o */
                            switch(src.charCodeAt(curIndex+2)) {
                            case 116: /* Char::t */
                                switch(src.charCodeAt(curIndex+3)) {
                                case 101: /* Char::e */
                                    if (src.charCodeAt(curIndex+4) == 99 /* Char::c */ &&
                                        src.charCodeAt(curIndex+5) == 116 /* Char::t */ &&
                                        src.charCodeAt(curIndex+6) == 101 /* Char::e */ &&
                                        src.charCodeAt(curIndex+7) == 100 /* Char::d */ &&
                                        notPartOfIdent[src.charCodeAt(curIndex+8)]) {
                                        curIndex += 8;
                                        return Token::Protected;
                                    }
                                    break bigswitch;
                                case 111: /* Char::o */
                                    if (src.charCodeAt(curIndex+4) == 116 /* Char::t */ &&
                                        src.charCodeAt(curIndex+5) == 121 /* Char::y */ &&
                                        src.charCodeAt(curIndex+6) == 112 /* Char::p */ &&
                                        src.charCodeAt(curIndex+7) == 101 /* Char::e */ &&
                                        notPartOfIdent[src.charCodeAt(curIndex+8)]) {
                                        curIndex += 8;
                                        return Token::Prototype;
                                    }
                                    break bigswitch;
                                default:
                                    break bigswitch;
                                }
                            default:
                                break bigswitch;
                            }
                        default:
                            break bigswitch;
                        }
                    case 117: /* Char::u */
                        if (src.charCodeAt(curIndex+1) == 98 /* Char::b */ &&
                            src.charCodeAt(curIndex+2) == 108 /* Char::l */ &&
                            src.charCodeAt(curIndex+3) == 105 /* Char::i */ &&
                            src.charCodeAt(curIndex+4) == 99 /* Char::c */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+5)]) {
                            curIndex += 5;
                            return Token::Public;
                        }
                        break bigswitch;
                    default:
                        break bigswitch;
                    }
                case 114: /* Char::r */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 101: /* Char::e */
                        if (src.charCodeAt(curIndex+1) == 116 /* Char::t */ &&
                            src.charCodeAt(curIndex+2) == 117 /* Char::u */ &&
                            src.charCodeAt(curIndex+3) == 114 /* Char::r */ &&
                            src.charCodeAt(curIndex+4) == 110 /* Char::n */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+5)]) {
                            curIndex += 5;
                            return Token::Return;
                        }
                        break bigswitch;
                    case 111: /* Char::o */
                        if (src.charCodeAt(curIndex+1) == 117 /* Char::u */ &&
                            src.charCodeAt(curIndex+2) == 110 /* Char::n */ &&
                            src.charCodeAt(curIndex+3) == 100 /* Char::d */ &&
                            src.charCodeAt(curIndex+4) == 105 /* Char::i */ &&
                            src.charCodeAt(curIndex+5) == 110 /* Char::n */ &&
                            src.charCodeAt(curIndex+6) == 103 /* Char::g */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+7)]) {
                            curIndex += 7;
                            return Token::Rounding;
                        }
                        break bigswitch;
                    default:
                        break bigswitch;
                    }
                case 115: /* Char::s */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 101: /* Char::e */
                        if (src.charCodeAt(curIndex+1) == 116 /* Char::t */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+2)]) {
                            curIndex += 2;
                            return Token::Set;
                        }
                        break bigswitch;
                    case 116: /* Char::t */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 97: /* Char::a */
                            switch(src.charCodeAt(curIndex+2)) {
                            case 110: /* Char::n */
                                if (src.charCodeAt(curIndex+3) == 100 /* Char::d */ &&
                                    src.charCodeAt(curIndex+4) == 97 /* Char::a */ &&
                                    src.charCodeAt(curIndex+5) == 114 /* Char::r */ &&
                                    src.charCodeAt(curIndex+6) == 100 /* Char::d */ &&
                                    notPartOfIdent[src.charCodeAt(curIndex+7)]) {
                                    curIndex += 7;
                                    return Token::Standard;
                                }
                                break bigswitch;
                            case 116: /* Char::t */
                                if (src.charCodeAt(curIndex+3) == 105 /* Char::i */ &&
                                    src.charCodeAt(curIndex+4) == 99 /* Char::c */ &&
                                    notPartOfIdent[src.charCodeAt(curIndex+5)]) {
                                    curIndex += 5;
                                    return Token::Static;
                                }
                                break bigswitch;
                            default:
                                break bigswitch;
                            }
                        case 114: /* Char::r */
                            if (src.charCodeAt(curIndex+2) == 105 /* Char::i */ &&
                                src.charCodeAt(curIndex+3) == 99 /* Char::c */ &&
                                src.charCodeAt(curIndex+4) == 116 /* Char::t */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+5)]) {
                                curIndex += 5;
                                return Token::Strict;
                            }
                            break bigswitch;
                        default:
                            break bigswitch;
                        }
                    case 117: /* Char::u */
                        if (src.charCodeAt(curIndex+1) == 112 /* Char::p */ &&
                            src.charCodeAt(curIndex+2) == 101 /* Char::e */ &&
                            src.charCodeAt(curIndex+3) == 114 /* Char::r */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+4)]) {
                            curIndex += 4;
                            return Token::Super;
                        }
                        break bigswitch;
                    case 119: /* Char::w */
                        if (src.charCodeAt(curIndex+1) == 105 /* Char::i */ &&
                            src.charCodeAt(curIndex+2) == 116 /* Char::t */ &&
                            src.charCodeAt(curIndex+3) == 99 /* Char::c */ &&
                            src.charCodeAt(curIndex+4) == 104 /* Char::h */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+5)]) {
                            curIndex += 5;
                            return Token::Switch;
                        }
                        break bigswitch;
                    default:
                        break bigswitch;
                    }
                case 116: /* Char::t */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 104: /* Char::h */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 105: /* Char::i */
                            if (src.charCodeAt(curIndex+2) == 115 /* Char::s */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                                curIndex += 3;
                                return Token::This;
                            }
                            break bigswitch;
                        case 114: /* Char::r */
                            if (src.charCodeAt(curIndex+2) == 111 /* Char::o */ &&
                                src.charCodeAt(curIndex+3) == 119 /* Char::w */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+4)]) {
                                curIndex += 4;
                                return Token::Throw;
                            }
                            break bigswitch;
                        default:
                            break bigswitch;
                        }
                    case 111: /* Char::o */
                        if (!(notPartOfIdent[src.charCodeAt(curIndex+1)])) 
                            break bigswitch;
                        curIndex += 1;
                        return Token::To;
                    case 114: /* Char::r */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 117: /* Char::u */
                            if (src.charCodeAt(curIndex+2) == 101 /* Char::e */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                                curIndex += 3;
                                return Token::True;
                            }
                            break bigswitch;
                        case 121: /* Char::y */
                            if (!(notPartOfIdent[src.charCodeAt(curIndex+2)])) 
                                break bigswitch;
                            curIndex += 2;
                            return Token::Try;
                        default:
                            break bigswitch;
                        }
                    case 121: /* Char::y */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 112: /* Char::p */
                            switch(src.charCodeAt(curIndex+2)) {
                            case 101: /* Char::e */
                                if (src.charCodeAt(curIndex+3) == 111 /* Char::o */ &&
                                    src.charCodeAt(curIndex+4) == 102 /* Char::f */ &&
                                    notPartOfIdent[src.charCodeAt(curIndex+5)]) {
                                    curIndex += 5;
                                    return Token::TypeOf;
                                }
                                if (!(notPartOfIdent[src.charCodeAt(curIndex+3)])) 
                                    break bigswitch;
                                curIndex += 3;
                                return Token::Type;
                            default:
                                break bigswitch;
                            }
                        default:
                            break bigswitch;
                        }
                    default:
                        break bigswitch;
                    }
                case 117: /* Char::u */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 105: /* Char::i */
                        if (src.charCodeAt(curIndex+1) == 110 /* Char::n */ &&
                            src.charCodeAt(curIndex+2) == 116 /* Char::t */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                            curIndex += 3;
                            return Token::UInt;
                        }
                        break bigswitch;
                    case 110: /* Char::n */
                        switch(src.charCodeAt(curIndex+1)) {
                        case 100: /* Char::d */
                            if (src.charCodeAt(curIndex+2) == 101 /* Char::e */ &&
                                src.charCodeAt(curIndex+3) == 102 /* Char::f */ &&
                                src.charCodeAt(curIndex+4) == 105 /* Char::i */ &&
                                src.charCodeAt(curIndex+5) == 110 /* Char::n */ &&
                                src.charCodeAt(curIndex+6) == 101 /* Char::e */ &&
                                src.charCodeAt(curIndex+7) == 100 /* Char::d */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+8)]) {
                                curIndex += 8;
                                return Token::Undefined;
                            }
                            break bigswitch;
                        case 105: /* Char::i */
                            if (src.charCodeAt(curIndex+2) == 116 /* Char::t */ &&
                                notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                                curIndex += 3;
                                return Token::Unit;
                            }
                            break bigswitch;
                        default:
                            break bigswitch;
                        }
                    case 115: /* Char::s */
                        if (src.charCodeAt(curIndex+1) == 101 /* Char::e */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+2)]) {
                            curIndex += 2;
                            return Token::Use;
                        }
                        break bigswitch;
                    default:
                        break bigswitch;
                    }
                case 118: /* Char::v */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 97: /* Char::a */
                        if (src.charCodeAt(curIndex+1) == 114 /* Char::r */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+2)]) {
                            curIndex += 2;
                            return Token::Var;
                        }
                        break bigswitch;
                    case 111: /* Char::o */
                        if (src.charCodeAt(curIndex+1) == 105 /* Char::i */ &&
                            src.charCodeAt(curIndex+2) == 100 /* Char::d */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                            curIndex += 3;
                            return Token::Void;
                        }
                        break bigswitch;
                    default:
                        break bigswitch;
                    }
                case 119: /* Char::w */
                    switch(src.charCodeAt(curIndex+0)) {
                    case 104: /* Char::h */
                        if (src.charCodeAt(curIndex+1) == 105 /* Char::i */ &&
                            src.charCodeAt(curIndex+2) == 108 /* Char::l */ &&
                            src.charCodeAt(curIndex+3) == 101 /* Char::e */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+4)]) {
                            curIndex += 4;
                            return Token::While;
                        }
                        break bigswitch;
                    case 105: /* Char::i */
                        if (src.charCodeAt(curIndex+1) == 116 /* Char::t */ &&
                            src.charCodeAt(curIndex+2) == 104 /* Char::h */ &&
                            notPartOfIdent[src.charCodeAt(curIndex+3)]) {
                            curIndex += 3;
                            return Token::With;
                        }
                        break bigswitch;
                    default:
                        break bigswitch;
                    }
                case 120: /* Char::x */
                    if (src.charCodeAt(curIndex+0) == 109 /* Char::m */ &&
                        src.charCodeAt(curIndex+1) == 108 /* Char::l */ &&
                        notPartOfIdent[src.charCodeAt(curIndex+2)]) {
                        curIndex += 2;
                        return Token::Xml;
                    }
                    break bigswitch;
                case 121: /* Char::y */
                    if (src.charCodeAt(curIndex+0) == 105 /* Char::i */ &&
                        src.charCodeAt(curIndex+1) == 101 /* Char::e */ &&
                        src.charCodeAt(curIndex+2) == 108 /* Char::l */ &&
                        src.charCodeAt(curIndex+3) == 100 /* Char::d */ &&
                        notPartOfIdent[src.charCodeAt(curIndex+4)]) {
                        curIndex += 4;
                        return Token::Yield;
                    }
                    break bigswitch;

                // End generated code

                case  92 /* Char::BackSlash*/:
                    // FIXME: probably not quite right
                    break bigswitch;

                case  48 /* Char::Zero */: 
                case  49 /* Char::One */:
                case  50 /* Char::Two */:
                case  51 /* Char::Three */:
                case  52 /* Char::Four */:
                case  53 /* Char::Five */:
                case  54 /* Char::Six */:
                case  55 /* Char::Seven */:
                case  56 /* Char::Eight */:
                case  57 /* Char::Nine */:
                    markIndex = --curIndex;
                    return numberLiteral ();

                default:
                    break bigswitch;
                }

                // end of bigswitch.

                // Identifiers are handled here (and only here).
                //
                // It is never necessary to check whether the
                // identifier might be a keyword.  In cases where the
                // input is "breakX" where X is a non-identifier
                // character then break will in fact be returned first
                // because of how the notPartOfIdentifier logic works,
                // but since the X is not an identifier constituent
                // there will be an immediate syntax error.  That's
                // good enough for me.

                --curIndex;
                return identifier();
            }
        }

        // All number literals start here without having consumed any
        // input.
        //
        // It's a minor weakness of the current token representation
        // that the value it carries can only be a string.  If not, we
        // would create number values right here and would avoid
        // re-converting the strings in the parser when the AST nodes
        // are created.

        function numberLiteral() : int {
            switch (src.charCodeAt(curIndex)) {
            case  48 /* Char::0 */: 
                // Octal / hex / a single 0 / 0.something
                switch (src.charCodeAt(curIndex+1)) {
                case 120 /* Char::x */:
                case  88 /* Char::X */:
                    curIndex += 2;
                    markIndex = curIndex;
                    if (!hexDigits(-1))
                        Lex::syntaxError("Illegal hexadecimal literal: no digits");
                    return makeIntegerLiteral( parseInt(lexeme(), 16) );

                case  46 /* Char::Dot */:
                    curIndex += 2;
                    numberFraction(true);
                    return makeFloatingLiteral( lexeme() );
                        
                default:
                    // Octal or single '0'
                    if (src.charCodeAt(curIndex) === 109 /* Char::m */)
                        return makeFloatingLiteral( lexeme() );

                    octalLiteral ();
                    return makeIntegerLiteral( parseInt(lexeme(), 8) );
                }

            case  46 /* Char::Dot */:
                curIndex++;
                numberFraction(false);
                return makeFloatingLiteral( lexeme() );

            default:
                if (numberLiteralPrime() || src.charCodeAt(curIndex) === 109 /* Char::m */)
                    return makeFloatingLiteral( lexeme() );
                else
                    return makeIntegerLiteral( parseInt(lexeme(), 10) );
            }
        }

        function makeIntegerLiteral( n ) {
            checkNextCharForNumber();

            if (n >= -0x80000000 && n <= 0x7FFFFFFF)
                return Token::makeInstance( Token::IntLiteral, String(n) );
            if (n >= 0x80000000 && n <= 0xFFFFFFFF)
                return Token::makeInstance( Token::UIntLiteral, String(n) );
            return Token::makeInstance( Token::DoubleLiteral, String(n) );
        }

        function makeFloatingLiteral( s ) {
            if (src.charCodeAt(curIndex) === 109 /* Char::m */) {
                curIndex++;

                checkNextCharForNumber();
                return Token::makeInstance( Token::DecimalLiteral, s );
            }
            else {
                checkNextCharForNumber();
                return Token::makeInstance( Token::DoubleLiteral, s );
            }
        }

        function checkNextCharForNumber() {
            let c = src.charCodeAt(curIndex);
            if (c >= 48 /* Char::Zero */ && c <= 57 /* Char::Nine */ ||
                Char::isIdentifierStart(c))
                Lex::syntaxError("Illegal character following numeric literal: " + String.fromCharCode(c));
        }

        function numberLiteralPrime() {
            if (!decimalDigits(-1))
                Lex::syntaxError("Illegal number: no digits");
            
            switch (src.charCodeAt(curIndex)) {
            case  46 /* Char::Dot */:
                curIndex++;
                numberFraction (true);
                return true;

            case 101 /* Char::e */: 
            case  69 /* Char::E */:
                curIndex++;
                numberExponent ();
                return true;

            default:
                return false;
            }
        }

        // The '.' has been consumed.
        //
        // has_leading_digits should be true if digits have been seen
        // before the '.'.

        function numberFraction(has_leading_digits) {
            if (!decimalDigits (-1) && !leading)
                Lex::syntaxError("Illegal number: must have digits before or after decimal point");

            switch (src.charCodeAt(curIndex)) {
            case 101 /* Char::e */: 
            case  69 /* Char::E */:
                curIndex++;
                numberExponent ();
                break;
            }
        }

        // The 'e' has been consumed...

        function numberExponent () {
            switch (src.charCodeAt(curIndex)) {
            case  43 /* Char::Plus */:
            case  45 /* Char::Minus */:
                curIndex++;
                break;
            }
            if (!decimalDigits(-1))
                Lex::syntaxError("Illegal number: missing digits in exponent");
        }

        function octalLiteral () {
            if (!octalDigits(-1))
                Lex::syntaxError("Illegal octal literal: no digits");

            switch (src.charCodeAt(curIndex)) {
            case  56 /* Char::Eight */:
            case  57 /* Char::Nine */:
                Lex::syntaxError("Illegal octal literal: non-octal digit");
            }
        }

        function octalDigits(k): boolean {
            let startIndex = curIndex;
            loop:
            while (k != 0) {
                switch (src.charCodeAt(curIndex)) {
                case  48 /* Char::Zero */:
                case  49 /* Char::One */:
                case  50 /* Char::Two */:
                case  51 /* Char::Three */:
                case  52 /* Char::Four */:
                case  53 /* Char::Five */:
                case  54 /* Char::Six */:
                case  55 /* Char::Seven */:
                    k--;
                    curIndex++;
                    continue;

                default:
                    break loop;
                }
            }
            return curIndex > startIndex && k <= 0;
        }

        function decimalDigits(k): boolean {
            let startIndex = curIndex;
            loop:
            while (k != 0) {
                switch (src.charCodeAt(curIndex)) {
                case  48 /* Char::Zero */:
                case  49 /* Char::One */:
                case  50 /* Char::Two */:
                case  51 /* Char::Three */:
                case  52 /* Char::Four */:
                case  53 /* Char::Five */:
                case  54 /* Char::Six */:
                case  55 /* Char::Seven */:
                case  56 /* Char::Eight */:
                case  57 /* Char::Nine */:
                    k--;
                    curIndex++;
                    continue;

                default:
                    break loop;
                }
            }
            return curIndex > startIndex && k <= 0;
        }

        function hexDigits(k): boolean {
            let startIndex = curIndex;
            loop:
            while (k != 0) {
                switch (src.charCodeAt(curIndex)) {
                case  48 /* Char::Zero */:
                case  49 /* Char::One */:
                case  50 /* Char::Two */:
                case  51 /* Char::Three */:
                case  52 /* Char::Four */:
                case  53 /* Char::Five */:
                case  54 /* Char::Six */:
                case  55 /* Char::Seven */:
                case  56 /* Char::Eight */:
                case  57 /* Char::Nine */:
                case  97 /* Char::a */: case  65 /* Char::A */:
                case  98 /* Char::b */: case  66 /* Char::B */:
                case  99 /* Char::c */: case  67 /* Char::C */:
                case 100 /* Char::d */: case  68 /* Char::D */:
                case 101 /* Char::e */: case  69 /* Char::E */:
                case 102 /* Char::f */: case  70 /* Char::F */:
                    k--;
                    curIndex++;
                    continue;

                default:
                    break loop;
                }
            }
            return curIndex > startIndex && k <= 0;
        }

        function lineComment () {
            let cachedIndex = curIndex;
            let cachedSrc = src;
            while (true) {
                switch (cachedSrc.charCodeAt(cachedIndex++)) {
                case 10 /* Char::Newline */:
                case 13 /* Char::Return */:
                    cachedIndex--;
                    curIndex = cachedIndex;
                    return;
                }
            }
        }

        function blockComment () {
            let newlines = false;
            let cachedIndex = curIndex;
            let cachedSrc = src;

            while (true) {
                let c;
                while ((c = cachedSrc.charCodeAt(cachedIndex++)) != 42 /* Char::Asterisk */ &&
                       c != 10 /* Char::Newline */ &&
                       c != 13 /* Char::Return */)
                    ;
                if (c == 42 /* Char::Asterisk */ && cachedSrc.charCodeAt(cachedIndex) == 47 /* Char::Slash */) {
                    cachedIndex++;
                    curIndex = cachedIndex;
                    return newlines;
                }
                if (c == 13 /* Char::Return */) {
                    if (cachedSrc.charCodeAt(cachedIndex) == 10 /* Char::Newline */)
                        cachedIndex++;
                    c = 10;
                }
                if (c == 10 /* Char::Newline */) {
                    if (cachedIndex == cachedSrc.length) {
                        cachedIndex--;
                        curIndex = cachedIndex;
                        Lex::syntaxError("End of input in block comment");
                    }
                    lnCoord++;
                    newlines = true;
                }
            }
        }

        function identifier () : int {
            let cachedIndex = curIndex;
            let cachedSrc = src;
            let s = "";

            while (true) {
                // Rip through identifier characters that require no work,
                // do extra work only for backslash sequences.
                // Cases ordered by most likely characters first.
                let c;
                let start = cachedIndex;
                while (((c = cachedSrc.charCodeAt(cachedIndex)) >= 97 /* Char::a */ && c <= 122 /* Char::z */) ||
                       (c >= 65 /* Char::A */ && c <= 90 /* Char::Z */) ||
                       (c >= 48 /* Char::0 */ && c <= 57 /* Char::9 */) ||
                       c === 95 /* Char::_ */ ||
                       c === 36 /* Char::$ */ ||
                       Char::isUnicodeIdentifierPart(c))
                    cachedIndex++;
                s += src.substring(start,cachedIndex);
                if (c == 92 /* Char::backslash */) {
                    // FIXME!
                    Lex::internalError("Backslash support not implemented");
                }
                break;
            }

            if (s.length == 0)
                Lex::syntaxError("Invalid character in input: " + src.charCodeAt(cachedIndex));
            curIndex = cachedIndex;
            return Token::makeInstance(Token::Identifier, s);
        }

        function stringLiteral (delimiter) : int {
            let cachedSrc = src;
            let cachedIndex = curIndex;
            let c;
            let s = "";

            while (true) {
                let start = cachedIndex;
                while ((c = cachedSrc.charCodeAt(cachedIndex)) !== delimiter && 
                       c !== 92 /* Char::Backslash */ && 
                       c !== 10 /* Char::Newline */ &&
                       c !== 13 /* Char::Return */)
                    cachedIndex++;
                s += cachedSrc.substring(start, cachedIndex);

                if (c === delimiter) {
                    curIndex = cachedIndex + 1;
                    return Token::makeInstance (Token::StringLiteral, s);
                }
                else if (c === 92 /* Char::Backslash */) {
                    curIndex = cachedIndex + 1;
                    s += String.fromCharCode(escapeSequence());
                    cachedIndex = curIndex;
                }
                else
                    Lex::syntaxError("Unterminated string literal: " + s);
            }
        }

        function escapeSequence () : int {
            switch (src.charCodeAt(curIndex)) {
            case  48 /* Char::Zero */:
            case  49 /* Char::One */:
            case  50 /* Char::Two */:
            case  51 /* Char::Three */:
            case  52 /* Char::Four */:
            case  53 /* Char::Five */:
            case  54 /* Char::Six */:
            case  55 /* Char::Seven */:
                return octalOrNulEscape ();

            case 120 /* Char::x */:
                curIndex++;
                return hexEscape (2);

            case 117 /* Char::u */:
                curIndex++;
                return hexEscape (4);

            case  98 /* Char::b */:
                curIndex++;
                return Char::Backspace;

            case 102 /* Char::f */:
                curIndex++;
                return Char::Formfeed;

            case 110 /* Char::n */:
                curIndex++;
                return Char::Newline;

            case 114 /* Char::r */:
                curIndex++;
                return Char::CarriageReturn;

            case 116 /* Char::t */:
                curIndex++;
                return Char::Tab;

            case 118 /* Char::v */:
                curIndex++;
                return Char::VerticalTab;

            case  39 /* Char::SingleQuote */:
            case  34 /* Char::DoubleQuote */:
            case  92 /* Char::BackSlash */:
                return src.charCodeAt(curIndex++);

            default:
                Lex::syntaxError("Illegal escape character " + c);
            }
        }

        function octalOrNulEscape () : uint
        {
            switch (src.charCodeAt(curIndex)) {
            case  48 /* Char::Zero */:
                curIndex++;
                switch (src.charCodeAt(curIndex)) {
                case  /* 49 */ Char::One :
                case  50 /* Char::Two */:
                case  51 /* Char::Three */:
                case  52 /* Char::Four */:
                case  53 /* Char::Five */:
                case  54 /* Char::Six */:
                case  55 /* Char::Seven */:
                    return octalEscape(3);
                default:
                    return 0;  // \0
                }

            case  49 /* Char::One */:
            case  50 /* Char::Two */:
            case  51 /* Char::Three */:
                return octalEscape(3);

            case  52 /* Char::Four */:
            case  53 /* Char::Five */:
            case  54 /* Char::Six */:
            case  55 /* Char::Seven */:
                return octalEscape(2);

            default:
                Lex::syntaxError( "Expecting octal character, got " + c);
            }
        }

        function octalEscape (n) {
            markIndex = curIndex;
            octalDigits(n);                 // ignore result
            return parseInt(lexeme(), 8);
        }

        // Any leading x has been consumed.  n is the number of digits to consume and require.

        function hexEscape (n) : uint {
            markIndex = curIndex;
            if (!hexDigits(n))
                Lex::syntaxError("Wrong number of hexadecimal digits; expected " + n);
            return parseInt(lexeme(), 16);
        }
    }

    function test()
    {
        print ("testing lex-scan.es");
        let testCases = [ "break case catch continue default delete do else enum extends"
                          , "false finally for function if in instanceof new null return"
                          , "super switch this throw true try typeof var void while with"
                          , "call cast const decimal double dynamic each eval final get has"
                          , "implements import int interface internal intrinsic is let namespace"
                          , "native Number override package precision private protected prototype public"
                          , "rounding standard strict static to type uint undefined use xml yield"
                          , ". .< .. ... ! != !== % %= & && &&= * *= + +- ++ - -- -="
                          , "/ /= /> < <= </ << <<= = == === > >= >> >>= >>> >>>="
                          , "^ ^= | |= || ||= : :: ( ) [ ] { } ~ @ , ; ?"
                          , "/* hello nobody */ hello // goodbye world"
                          , "0 0i 00 001u 0123d 045m 0x0 0xCAFEBABE 0x12345678u 1. .0 .2e+3 1.23m"
                          // , "\\u0050 \\x50gh \\073 \\73 \\073123 \\7398"
                          , "/abc/ 'hi' \"bye\" null break /def/xyz" ];

        for (var i = 0; i < testCases.length; ++i) {
            var scan = new Scanner (testCases[i],"test"+i);
            var [tokens,coords] = scan.tokenList (scan.start);
            print ("tokens ", tokens);
            print ("coords ", coords);
            for (var j=0; j<tokens.length; ++j) {
                if (tokens[j] == Token::BREAK) {
                    if (i == testCases.length-1) {   // if last test, then scan for regexps
                        var [tokens,coords] = scan.tokenList (scan.regexp);
                    }
                    else {
                        [tokens,coords] = scan.tokenList (scan.div);
                    }
                    print ("tokens ", tokens);
                    print ("coords ", coords);
                }
            }
            print ("scanned!");
        }
    }
    //Lex::test ();
}
