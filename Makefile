all: BRSParser
	tsc

BRSParser:
	jison --outfile ./Bartleby/Rules/Builder/BRSFile/RuleParser.js src/Bartleby/Rules/Builder/BRSFile/RuleParser.jison

clean:
	find . \! -path './node_modules/*' -type f -name "*.js"  -delete

