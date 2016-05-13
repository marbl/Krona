#!/usr/bin/env perl

#!/usr/bin/env perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.

use strict;

BEGIN
{
	use File::Basename;
	use Cwd 'abs_path';
	use lib dirname(abs_path($0)) . "/../lib";
	use KronaTools;
}

if ( @ARGV < 2 )
{
	my $scriptName = getScriptName();
	
	printHeader("KronaTools $KronaTools::version - $scriptName");
	print
'Takes an ACE assembly file and writes a magnitude file for use with import
scripts.  The magnitude of each contig will be the total number of reads
assigned to it.

';
	printHeader('Usage');
	print
"$scriptName <assembly.ace> <output>

";
	exit;
}

my ($ace, $output) = @ARGV;


open ACE, "<$ace" or die $!;
open OUT, ">$output" or die $!;

while ( my $line = <ACE> )
{
	if ( $line =~ /^CO\s+([^\s]+)\s+\d+\s+(\d+)/ )
	{
		print OUT "$1\t$2\n";
	}
}

close OUT;
close ACE;
