#!/usr/bin/env perl

while (my $line = <>)
{
	if ( $line =~ /<node/ )
	{
		my $name;
		my $magnitude;
		my $score;
		
		$line =~ /name=\"([^"]+)\"/;
		$name = $1;
		$line =~ /magnitude=\"([^"]+)\"/;
		$magnitude = $1;
		$line =~ /score=\"([^"]+)\"/;
		$score = $1;
		
		print "$name\t$magnitude\t$score\n";
	}
}
