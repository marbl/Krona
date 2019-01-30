#! /bin/bash

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.

# This would not resolve symlink:
# ktPath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
# Therefore this:
# perl function to resolve symlinks that will function on Linux and OSX (since 'readlink -f' is different under OSX)
readlink_f(){ perl -MCwd -e 'print Cwd::abs_path shift' "$1";}
ktPath=$(dirname $(readlink_f $0))

$ktPath/updateTaxonomy.sh --accessions $@
