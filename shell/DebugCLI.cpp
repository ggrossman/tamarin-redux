/* -*- Mode: C++; c-basic-offset: 4; indent-tabs-mode: nil; tab-width: 4 -*- */
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

#include "avmshell.h"

#ifdef DEBUGGER
namespace avmshell
{
    /**
     * The array of top level commands that we support.
     * They are placed into a Nx2 array, whereby the first component
     * is a String which is the command and the 2nd component is the
     * integer identifier for the command.
     *
     * NOTE: order matters!  For the case of a single character
     *       match, we let the first hit act like an unambiguous match.
     */
    DebugCLI::StringInt DebugCLI::commandArray[] =
    {
        { "break", CMD_BREAK },
        { "bt", INFO_STACK_CMD },
        { "continue", CMD_CONTINUE },
        { "delete", CMD_DELETE },
        { "finish", CMD_FINISH },
        { "help", CMD_HELP },
        { "?", CMD_HELP },
        { "info", CMD_INFO },
        { "list", CMD_LIST },
        { "next", CMD_NEXT },
        { "print", CMD_PRINT },
        { "quit", CMD_QUIT },
        { "step", CMD_STEP },
        { "set", CMD_SET },
        { "where", INFO_STACK_CMD },
        { NULL, 0 }
    };

    /**
     * Info sub-commands
     */
    DebugCLI::StringInt DebugCLI::infoCommandArray[] =
    {
        { "arguments", INFO_ARGS_CMD },
        { "breakpoints", INFO_BREAK_CMD },
        { "files", INFO_FILES_CMD },
        { "functions", INFO_FUNCTIONS_CMD },
        { "locals", INFO_LOCALS_CMD },
        { "stack", INFO_STACK_CMD },
        { NULL, 0 }
    };

    DebugCLI::DebugCLI(AvmCore *core, Debugger::TraceLevel tracelevel)
        : Debugger(core, tracelevel)
    {
        currentSourceLen = 0;
        warnMissingSource = true;
    }

    DebugCLI::~DebugCLI()
    {
        if (currentSource) {
            delete [] currentSource;
            currentSource = NULL;
        }
    }

    char* DebugCLI::nextToken()
    {
        char *out = currentToken;
        if (currentToken) {
            while (*currentToken) {
                if (*currentToken == ' ' || *currentToken == '\r' || *currentToken == '\n' || *currentToken == '\t') {
                    *currentToken++ = 0;
                    break;
                }
                currentToken++;
            }
            currentToken = *currentToken ? currentToken : NULL;
        }
        return out;
    }

    /**
     * Attempt to match given the given string against our set of commands
     * @return the command code that was hit.
     */
    int DebugCLI::determineCommand(DebugCLI::StringInt cmdList[],
                                   const char *input,
                                   int defCmd)
    {
        if (!input) return INFO_UNKNOWN_CMD;

        int inputLen = (int)VMPI_strlen(input);

        // first check for a comment
        if (input[0] == '#') {
            return CMD_COMMENT;
        }

        int match = -1;
        bool ambiguous = false;

        for (int i=0; cmdList[i].text; i++) {
            if (!VMPI_strncmp(input, cmdList[i].text, inputLen)) {
                if (match != -1) {
                    ambiguous = true;
                    break;
                }
                match = i;
            }
        }

        /**
         * 3 cases:
         *  - No hits, return unknown and let our caller
         *    dump the error.
         *  - We match unambiguously or we have 1 or more matches
         *    and the input is a single character. We then take the
         *    first hit as our command.
         *  - If we have multiple hits then we dump a 'ambiguous' message
         *    and puke quietly.
         */
        if (match == -1) {
            // no command match return unknown
            return defCmd;
        }
        // only 1 match or our input is 1 character or first match is exact
        else if (!ambiguous || inputLen == 1 || !VMPI_strcmp(cmdList[match].text, input)) {
            return cmdList[match].id;
        }
        else {
            // matches more than one command dump message and go
            core->console << "Ambiguous command '" << input << "': ";
            bool first = true;
            for (int i=0; cmdList[i].text; i++) {
                if (!VMPI_strncmp(cmdList[i].text, input, inputLen)) {
                    if (!first) {
                        core->console << ", ";
                    } else {
                        first = false;
                    }
                    core->console << cmdList[i].text;
                }
            }
            core->console << ".\n";
            return -1;
        }
    }

    const char* DebugCLI::commandNumberToCommandName(DebugCLI::StringInt cmdList[],
                                                     int cmdNumber)
    {
        for (int i = 0; cmdList[i].text; i++)
        {
            if (cmdList[i].id == cmdNumber)
                return cmdList[i].text;
        }

        return "?";
    }

    bool DebugCLI::printFrame(int k)
    {
        Atom* ptr;
        int count, line = -1;
        SourceInfo* src = NULL;
        AvmCore* core = AvmCore::getActiveCore();
        DebugFrame* frame = core->debugger()->frameAt(k);
        if (frame == NULL) return false;

        // source information
        frame->sourceLocation(src, line);

        core->console << "#" << k << "   ";

        // this
        Atom a = nullObjectAtom;
        frame->dhis(a);
        core->console << core->format(a) << ".";

        // method
        MethodInfo* info = functionFor(src, line);
        if (info) {
            core->console << info->getMethodName();
        } else {
            Stringp name = NULL;
            if (frame->methodName(name))
                core->console << name;
            else
                core->console << "???";
        }

        core->console << "(";

        // dump args
        frame->arguments(ptr, count);
        for (int i=0; i<count; i++)
        {
            // write out the name
            Stringp nm;
                if (info && frame->argumentName(i, nm))
                    core->console << nm << "=";

                core->console << core->format(*ptr++);
                if (i<count-1)
                    core->console << ",";
        }
        core->console << ") at ";
        if (src)
            core->console << src->name() << ":" << (line) << "\n";
        else
            core->console << "???\n";

        return true;
    }

    void DebugCLI::bt()
    {
          AvmCore* core = AvmCore::getActiveCore();
        //core->stackTrace->dump(core->console);
        //core->console << '\n';

        // obtain information about each frame
        int frameCount = core->debugger()->frameCount();
        for(int k=0; k<frameCount; k++)
        {
                  printFrame(k);
        }
    }

    void DebugCLI::help()
    {
        StringInt* cmd;

        // "help info" shows sub-commands of the "info" command
        char* next = nextToken();
        if (next && commandFor(next) == CMD_INFO)
            cmd = infoCommandArray;
        else
            cmd = commandArray;

        while (cmd->text)
        {
            core->console << cmd->text;
            if (cmd->id == CMD_INFO)
                core->console << " (see 'help " << cmd->text << "' for sub-commands)";
            core->console << '\n';
            cmd++;
        }
    }

    MethodInfo* DebugCLI::functionFor(SourceInfo* src, int line)
    {
        MethodInfo* info = NULL;
        if (src)
        {
            // find the function at this location
            int size = src->functionCount();
            for(int i=0; i<size; i++)
            {
                MethodInfo* m = src->functionAt(i);
                if (line >= m->firstSourceLine() && line <= m->lastSourceLine())
                {
                    info = m;
                    break;
                }
            }
        }
        return info;
    }

    // zero based
    char* DebugCLI::lineStart(int linenum)
    {
        if (!currentSource && currentFile)
            setCurrentSource(currentFile);

        if (!currentSource) {
            return NULL;
        }

        // linenumbers map to zero based array entry
        char *ptr = currentSource;
        for (int i=0; i<linenum; i++) {
            // Scan to end of line
            while (*ptr != '\n') {
                if (!*ptr) {
                    return NULL;
                }
                ptr++;
            }
            // Advance past newline
            ptr++;
        }
        return ptr;
    }

    void DebugCLI::displayLines(int line, int count)
    {
        if (!lineStart(0)) {
            if (currentFile)
                core->console << currentFile;
            else
                core->console << "<unknown>";
            core->console <<":"<<line<<" ";
        } else {
            int lineAt = line;
            while(count-- > 0)
            {
                char* ptr = lineStart(lineAt-1);
                if (!ptr)
                {
                    #if WRAP_AROUND
                    lineAt = 1;
                    count++; // reset line number to beginning skip this iteration
                    #else
                    break;
                    #endif
                }
                else
                {
                    core->console << (lineAt) << ": ";
                    while (*ptr && *ptr != '\n')
                        core->console << *ptr++;
                    core->console << '\n';
                    lineAt++;
                }
            }
        }
    }

    void DebugCLI::list(const char* line)
    {
        int currentLine = (core->callStack) ? core->callStack->linenum() : 0;
        int linenum = (line) ? VMPI_atoi(line) : currentLine;
        displayLines(linenum, 10);
    }

    void DebugCLI::printIP()
    {
        int line = (core->callStack) ? core->callStack->linenum() : 0;
        displayLines(line, 1);
    }

    void DebugCLI::breakpoint(char *location)
    {
        if (!location)
        {
            core->console << "Bad format, should be: 'break [filename:]line'\n";
            return;
        }

        Stringp filename = currentFile;
        char *colon = VMPI_strchr(location, ':');

        if (colon) {
            *colon = 0;
            filename = core->internStringLatin1(location);
            location = colon+1;
        }

        if (abcCount() == 0) {
            core->console << "No abc file loaded\n";
            return;
        }

        SourceFile* sourceFile = NULL;
        for (int i = 0, n = abcCount(); i < n; ++i)
        {
            AbcFile* abcFile = (AbcFile*)abcAt(i);
            sourceFile = abcFile->sourceNamed(filename);
            if (sourceFile)
                break;
        }

        if (sourceFile == NULL) {
            core->console << "No source available; can't set breakpoint.\n";
            return;
        }

        int targetLine = VMPI_atoi(location);

        if (breakpointSet(sourceFile, targetLine)) {
            int breakpointId = ++breakpointCount;
            core->console << "Breakpoint " << breakpointId << ": file "
                          << filename
                          << ", " << (targetLine) << ".\n";

            BreakAction *breakAction = new (core->GetGC()) BreakAction(sourceFile,
                                                                  breakpointId,
                                                                  filename,
                                                                  targetLine);
            breakAction->prev = lastBreakAction;
            if (lastBreakAction) {
                lastBreakAction->next = breakAction;
            } else {
                firstBreakAction = breakAction;
            }
            lastBreakAction = breakAction;
        } else {
            core->console << "Could not locate specified line.\n";
        }
    }

    void DebugCLI::showBreakpoints()
    {
        BreakAction *breakAction = firstBreakAction;
        while (breakAction) {
            breakAction->print(core->console);
            breakAction = breakAction->next;
        }
    }

    void DebugCLI::deleteBreakpoint(char *idstr)
    {
        int id = VMPI_atoi(idstr);

        BreakAction *breakAction = firstBreakAction;
        while (breakAction) {
            if (breakAction->id == id) {
                break;
            }
            breakAction = breakAction->next;
        }

        if (breakAction) {
            if (breakAction->prev) {
                breakAction->prev->next = breakAction->next;
            } else {
                firstBreakAction = breakAction->next;
            }
            if (breakAction->next) {
                breakAction->next->prev = breakAction->prev;
            } else {
                lastBreakAction = breakAction->prev;
            }
            if (breakpointClear(breakAction->sourceFile, breakAction->linenum)) {
                core->console << "Breakpoint " << id << " deleted.\n";
            } else {
                core->console << "Internal error; could not delete breakpoint.\n";
            }
        } else {
            core->console << "Could not find breakpoint.\n";
        }
    }

    bool DebugCLI::locals(int frameNumber)
    {
        Atom* ptr;
        int count, line;
        SourceInfo* src = NULL;
        AvmCore* core = AvmCore::getActiveCore();
        DebugFrame* frame = core->debugger()->frameAt(frameNumber);
        if (frame == NULL) return false;

        // source information
        frame->sourceLocation(src, line);

        // method
        MethodInfo* info = functionFor(src, line);
        if (info) {
            frame->locals(ptr, count);
            for(int i=0; i<count; i++) {
                // write out the name
                Stringp nm = info->getLocalName(i);
                core->console << i << ": ";
                if (nm != core->kundefined)
                    core->console << nm;
                else
                    core->console << "<local_" << i << ">";
                core->console << " = " << core->format(*ptr++) << "\n";
            }
            return true;
        }
        return false;
    }

    bool DebugCLI::arguments(int frameNumber)
    {
         int count;
         Atom* arr;
         AvmCore* core = AvmCore::getActiveCore();
         DebugFrame* frame = core->debugger()->frameAt(frameNumber);
         if (frame && frame->arguments(arr, count)) {
             for (int i = 0; i < count; i++) {
                 Stringp nm = NULL;
                 frame->argumentName(i, nm);
                 core->console << i << ": " << nm << " = " << core->format(*arr++) << "\n";
             }
             return true;
         }
         return false;
    }

    Atom DebugCLI::ease2Atom(const char* to, Atom baseline)
    {
        // first make a string out of the value
        Atom a = core->newStringLatin1(to)->atom();

        // using the type of baseline try to convert to into an appropriate Atom
        if (core->isNumber(baseline))
            return core->numberAtom(a);
        else if (core->isBoolean(baseline))
            return AvmCore::booleanAtom(a);

        return nullStringAtom;
    }

    void DebugCLI::set()
    {
        const char* what = nextToken();
        const char* equ = nextToken();
        const char* to = nextToken();
        if (!to || !equ || !what || *equ != '=')
        {
            core->console << " Bad format, should be:  'set {variable} = {value}' \n";
        }
        else
        {
            // look for the varable in our locals or args.
            Atom* ptr;
            int count, line;
            SourceInfo* src;
            DebugFrame* frame = core->debugger()->frameAt(0);

            // source information
            frame->sourceLocation(src, line);
            if (!src)
            {
                core->console << "Unable to locate debug information for current source file, so no local or argument names known\n";
                return;
            }

            // method
            MethodInfo* info = functionFor(src, line);
            if (!info)
            {
                core->console << "Unable to find method debug information, so no local or argument names known\n";
                return;
            }

            frame->arguments(ptr, count);
            for(int i=0; i<count; i++)
            {
                Stringp arg = info->getArgName(i);
                if (arg->equalsLatin1(what))
                {
                    // match!
                    Atom a = ease2Atom(to, ptr[i]);
                    if (a == undefinedAtom)
                        core->console << " Type mismatch : current value is " << core->format(ptr[i]);
                    else
                        frame->setArgument(i, a);
                    return;
                }
            }

            frame->locals(ptr, count);
            for(int i=0; i<count; i++)
            {
                Stringp local = info->getLocalName(i);
                if ( local->equalsLatin1(what))
                {
                    // match!
                    Atom a = ease2Atom(to, ptr[i]);
                    if (a == undefinedAtom)
                        core->console << " Type mismatch : current value is " << core->format(ptr[i]);
                    else
                        frame->setLocal(i, a);
                    return;
                }
            }
        }
    }

    void DebugCLI::print(const char *name)
    {
        if (!name) {
            core->console << "Must specify a name.\n";
            return;
        }

        // todo deal with exceptions
        Multiname mname(
            core->getAnyPublicNamespace(),
            core->internStringLatin1(name)
        );

#if 0
        // rick fixme
        Atom objAtom = env->findproperty(outerScope, scopes, extraScopes, &mname, false);
        Atom valueAtom = env->getproperty(objAtom, &mname);
        core->console << core->string(valueAtom) << '\n';
#else
        core->console << "Command not implemented.\n";
#endif
    }

    bool DebugCLI::filterException(Exception *exception, bool /*willBeCaught*/)
    {
        // Filter exceptions when -d switch specified
        if (activeFlag) {
            core->console << "Exception has been thrown:\n"
                          << core->string(exception->atom)
                          << '\n';
            enterDebugger();
            return true;
        }
        return false;
    }

    void DebugCLI::info()
    {
        char *command = nextToken();
        int cmd = infoCommandFor(command);

        switch (cmd) {
        case -1:
            // ambiguous, we already printed error message
            break;
        case INFO_ARGS_CMD:
            arguments(0);
            break;
        case INFO_LOCALS_CMD:
            locals(0);
            break;
        case INFO_BREAK_CMD:
            showBreakpoints();
            break;
        case INFO_UNKNOWN_CMD:
            core->console << "Unknown command.\n";
            break;
        default:
            core->console << "Command not implemented.\n";
            break;
        }
    }

    bool DebugCLI::debuggerInterruptOnEnter = false;
    void DebugCLI::enterDebugger()
    {
        setCurrentSource( (core->callStack) ? (core->callStack->filename()) : 0 );
        if (debuggerInterruptOnEnter) {
            VMPI_debugBreak();
            return;
        }

        for (;;) {
            printIP();

            core->console << "(asdb) ";
            if (Platform::GetInstance()->getUserInput(commandLine, kMaxCommandLine) == NULL)
                Platform::GetInstance()->exit(0);

            commandLine[VMPI_strlen(commandLine)-1] = 0;

            if (!commandLine[0]) {
                VMPI_strcpy(commandLine, lastCommand);
            } else {
                VMPI_strcpy(lastCommand, commandLine);
            }

            currentToken = commandLine;

            char *command = nextToken();
            int cmd = commandFor(command);

            switch (cmd) {
            case -1:
                // ambiguous, we already printed error message
                break;
            case CMD_COMMENT:
                break;
            case CMD_INFO:
                info();
                break;
            case CMD_BREAK:
                breakpoint(nextToken());
                break;
            case CMD_DELETE:
                deleteBreakpoint(nextToken());
                break;
            case CMD_LIST:
                list(nextToken());
                break;
            case CMD_UNKNOWN:
                core->console << "Unknown command.\n";
                break;
            case CMD_QUIT:
                Platform::GetInstance()->exit(0);
                break;
            case CMD_CONTINUE:
                return;
            case CMD_PRINT:
                print(nextToken());
                break;
            case CMD_NEXT:
                stepOver();
                return;
            case INFO_STACK_CMD:
                bt();
                break;
            case CMD_FINISH:
                stepOut();
                return;
            case CMD_HELP:
                help();
                break;
            case CMD_STEP:
                stepInto();
                return;
            case CMD_SET:
                set();
                break;
            default:
                core->console << "Command not implemented.\n";
                break;
            }
        }
    }

    void DebugCLI::setCurrentSource(Stringp file)
    {
        if (!file)
            return;

        currentFile = file;

        if (currentSource) {
            delete [] currentSource;
            currentSource = NULL;
            currentSourceLen = 0;
        }

        // Open this file and suck it into memory
        StUTF8String currentFileUTF8(currentFile);
        FileInputStream f(currentFileUTF8.c_str());
        if (f.valid() && ((uint64_t)file->length() < UINT32_T_MAX)) { //cannot handle files > 4GB
            currentSourceLen = (uint32_t) f.available();
            currentSource = new char[currentSourceLen+1];
            f.read(currentSource, currentSourceLen);
            currentSource[currentSourceLen] = 0;

            // whip through converting \r\n to space \n
            for(int64_t i=0; i<currentSourceLen-1;i++) {
                if (currentSource[i] == '\r' && currentSource[i+1] == '\n')
                    currentSource[i] = ' ';
            }
        } else if (warnMissingSource) {
            core->console << "Could not find '" << currentFile << "'.  Try running in the same directory as the .as file.\n";
            warnMissingSource = false;
        }
    }

    //
    // BreakAction
    //

    void BreakAction::print(PrintWriter& out)
    {
        out << id << " at "
            << filename
            << ":" << (linenum) << '\n';
    }
}
#endif
