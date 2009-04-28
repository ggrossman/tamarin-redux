#!/bin/bash
#  ***** BEGIN LICENSE BLOCK *****
#  Version: MPL 1.1/GPL 2.0/LGPL 2.1
# 
#  The contents of this file are subject to the Mozilla Public License Version
#  1.1 (the "License"); you may not use this file except in compliance with
#  the License. You may obtain a copy of the License at
#  http://www.mozilla.org/MPL/
# 
#  Software distributed under the License is distributed on an "AS IS" basis,
#  WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
#  for the specific language governing rights and limitations under the
#  License.
# 
#  The Original Code is [Open Source Virtual Machine.].
# 
#  The Initial Developer of the Original Code is
#  Adobe System Incorporated.
#  Portions created by the Initial Developer are Copyright (C) 2009
#  the Initial Developer. All Rights Reserved.
# 
#  Contributor(s):
#    Adobe AS3 Team
# 
#  Alternatively, the contents of this file may be used under the terms of
#  either the GNU General Public License Version 2 or later (the "GPL"), or
#  the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
#  in which case the provisions of the GPL or the LGPL are applicable instead
#  of those above. If you wish to allow use of your version of this file only
#  under the terms of either the GPL or the LGPL, and not to allow others to
#  use your version of this file under the terms of the MPL, indicate your
#  decision by deleting the provisions above and replace them with the notice
#  and other provisions required by the GPL or the LGPL. If you do not delete
#  the provisions above, a recipient may use your version of this file under
#  the terms of any one of the MPL, the GPL or the LGPL.
# 
#  ***** END LICENSE BLOCK ****
(set -o igncr) 2>/dev/null && set -o igncr; # comment is needed



##
# Bring in the environment variables
##
. ./environment.sh


##
# Calculate the change number and change id
##
. ../all/util-calculate-change.sh $1


##
# Run any slave specific code PRE performance
##
. ./run-performance-pre.sh


echo scriptsdir: $scriptsdir


##
# Download the AVMSHELL
##
echo "Download AVMSHELL"
../all/util-download.sh $vmbuilds/$branch/$change/$platform/$shell_release $basedir/esc/bin/shell.exe
ret=$?
test "$ret" = "0" || {
    echo "Downloading of $shell_release failed"
    exit 1
}
chmod +x $basedir/esc/bin/shell.exe
echo ""
echo AVM=$basedir/esc/bin/shell.exe
echo "`$basedir/esc/bin/shell.exe`"
echo ""



cd $basedir/esc/build
make clean

##
# First compilation of ESC
##
test -f $scriptsdir/timing.txt && rm $scriptsdir/timing.txt
/usr/bin/time -v -o $scriptsdir/timing.txt make
ret=$?
test "$ret" = "0" || {
  echo "esc initial build failed..."
  exit 1
}
time=`cat $scriptsdir/timing.txt | grep "Elapsed" | awk '{print $8}' | awk -F: '{print $1*60+$2}'`
echo "message: 1st esc compile itself: $time"
make clean
test -f $scriptsdir/timing.txt && rm $scriptsdir/timing.txt


##
# Second compilation of ESC
##
test -f $scriptsdir/timing.txt && rm $scriptsdir/timing.txt
/usr/bin/time -v -o $scriptsdir/timing.txt make
ret=$?
test "$ret" = "0" || {
  echo "esc 2nd build failed..."
  exit 1
}
time=`cat $scriptsdir/timing.txt | grep "Elapsed" | awk '{print $8}' | awk -F: '{print $1*60+$2}'`
echo "message: 2nd esc compile itself: $time"
$scriptsdir/../all/util-esc-socketlog.py $change compile-time-esc=$time
make clean
test -f $scriptsdir/timing.txt && rm $scriptsdir/timing.txt


##
# Third compilation of ESC
##
test -f $scriptsdir/timing.txt && rm $scriptsdir/timing.txt
/usr/bin/time -v -o $scriptsdir/timing.txt make
ret=$?
test "$ret" = "0" || {
  echo "esc 3rd build failed..."
  exit 1
}
time=`cat $scriptsdir/timing.txt | grep "Elapsed" | awk '{print $8}' | awk -F: '{print $1*60+$2}'`
echo "message: 3rd esc compile itself: $time"
$scriptsdir/../all/util-esc-socketlog.py $change compile-time-esc=$time
make clean
test -f $scriptsdir/timing.txt && rm $scriptsdir/timing.txt


##
# Fourth compilation of ESC
##
test -f $scriptsdir/timing.txt && rm $scriptsdir/timing.txt
/usr/bin/time -v -o $scriptsdir/timing.txt make
ret=$?
test "$ret" = "0" || {
  echo "esc 4th build failed..."
  exit 1
}
time=`cat $scriptsdir/timing.txt | grep "Elapsed" | awk '{print $8}' | awk -F: '{print $1*60+$2}'`
echo "message: 4th esc compile itself: $time"
$scriptsdir/../all/util-esc-socketlog.py $change compile-time-esc=$time
make clean
test -f $scriptsdir/timing.txt && rm $scriptsdir/timing.txt


echo url: http://tamarin-builds.mozilla.org/performance/esc_10build_report.jsp?buildNumber=$change View 10 build Perf

test -f results.log && rm results.log
wget -O results.log -q "http://tamarin-builds.mozilla.org/performance/esc_10build_report.jsp?buildNumber=$change"
retry="0"
perfchg=""
while true
 do
  test -f results.log && {
    perfchg=`cat results.log | grep '<th id="1build">' | sed -e 's/^[ \t]*//;s/<th id="1build">//;s/<th id="1build" class="bad">//;s/<th id="1build" class="good">//;s*</th>**;'`
    break
  }
  retry=`echo $retry | awk '{ print $1+1 }'`
  test "$retry" = "20" && break
  sleep 1
done
echo "perfchange: ${perfchg}"


##
# Run any slave specific code PRE performance
##
cd $scriptsdir
. ./run-performance-post.sh
