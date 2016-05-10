#! /bin/bash

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.

ktPath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"

$ktPath/updateTaxonomy.sh --accessions $@
