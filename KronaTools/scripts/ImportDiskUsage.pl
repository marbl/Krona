#!/usr/bin/env perl

use strict;

BEGIN
{
	use File::Basename;
	use Cwd 'abs_path';
	use lib dirname(abs_path($0)) . "/../lib";
	use KronaTools;
}

my $otherName = '[Small files or folders]';

setOption('out', 'du.krona.html');

my @options =
qw(
	out
	url
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	my $scriptName = getScriptName();
	
	printHeader("KronaTools $KronaTools::version - $scriptName");
	print
'Creates a Krona chart of disk usage of files and folders in the specified
directory. Symbolic links and mount points within the directory are not
followed. Small files or folders (that are less than 0.1% of the total size)
will be grouped. The chart can be colored by log[10] of the number of days
since each file or folder was modified.
';
	printHeader('Usage');
	print
"$scriptName [options] <dir>
";
	printOptions(@options);
	exit;
}

my %all;
my ($path) = @ARGV;
my $time = time;

$path = abs_path($path);

my $name = basename($path);

if ( $name ne '/' )
{
	$name .= '/';
}

setOption('name', $name);
setOption('collapse', 0);
setOption('color', 0);

if ( ! -e $path )
{
	ktDie("\"$path\" does not exist.");
}

# First, get recursive sizes quickly with 'du'.  Then small directories don't
# have to be scanned later when building the tree and getting file stats.
#
my %sizes;

open DU, "du -aHkx '$path' 2> /dev/null |";
#
while ( <DU> )
{
	chomp;
	my ($size, $file) = split /\t/;
	$sizes{$file} = $size;
}
close DU;

my $total = $sizes{$path};
my $minSize = $total / 1000;

my @units =
qw(
	Kb
	Mb
	Gb
	Tb
	Eb
);

my $unit = int((log $total / 10) / (log 2) / 10);
my $unitSize = 2 ** ($unit * 10);

add(\%all, abs_path($path), 1);

my @attributeNames =
(
	'magnitude',
	'age',
	'score'
);

my @attributeDisplayNames =
(
	"Size ($units[$unit])",
	'Age (days since modified)',
	'Log(Age+1)'
);

my @datasetNames;

writeTree
(
	\%all,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	300,
	240
);

my $outFile = getOption('out');
#system("open $outFile");

sub add
{
	my $child;
	my ($node, $path, $big) = @_;
	
	if ( $big && ! defined ${$node}{'children'} )
	{
		${$node}{'children'} = ();
		${$node}{'href'} = 'file://localhost' . $path;
	}
	
	my @stats = stat $path;
	my $age = int(($time - $stats[9]) / 86400);
	
	if ( $age < 0 )
	{
		$age = 0;
	}
	
	my $logAge = log ($age + 1) / log 10;
	
	${$node}{'magnitude'}[0] += $sizes{$path} / $unitSize;
	
	if
	(
		$big ||
		! defined ${$node}{'scoreTotal'} ||
		$logAge < ${$node}{'scoreTotal'}[0]
	)
	{
		${$node}{'scoreTotal'}[0] = $logAge;
		${$node}{'scoreCount'}[0] = 1;
		${$node}{'age'}[0] = int($age);
	}
	
	if ( $big && -d $path && (! -l $path) && opendir DIR, $path )
	{
		my @files = readdir DIR;
		closedir DIR;
		
		if ( $path ne '/' )
		{
			$path .= '/';
		}
		
		foreach my $file ( @files )
		{
			if ( $file eq '.' || $file eq '..' )
			{
				next;
			}
			
			my $childName;
			
			my $childPath = $path . $file;
			my $big;
			
			if ( $sizes{$childPath} > $minSize )
			{
				if ( -d $childPath )
				{
					$file .= '/';
				}
				
				$childName = $file;
				$big = 1; # tell add() that this child is big enough to show
			}
			else
			{
				$childName = $otherName; # group this child with others
			}
			
			if ( ! defined ${$node}{'children'}{$childName} )
			{
				my %newHash = ();
				${$node}{'children'}{$childName} = \%newHash;
			}
			
			$child = ${$node}{'children'}{$childName};
			
			add($child, $childPath, $big);
		}
	}
}
