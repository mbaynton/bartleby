/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
"Node"|"Service"      return 'SELECTOR_CLASS'
"<"                   return '<'
">"                   return '>'
"="                   return '='
"["                   return '['
"]"                   return ']'
"."                   return '.'
"{"                   return '{'
"}"                   return '}'
"("                   return '('
")"                   return ')'
"."                   return '.'
","                   return ','
";"                   return ';'
"passing"|"warning"|"critical"     return 'HEALTH_STATUS'
["][^"]*["]           return 'QUOTED_STR' /* todo: more better */
"for"                 return 'FOR' /* todo: add js reserved words */
true|false|TRUE|FALSE return 'BOOLEAN'
null|NULL             return 'NULL'
\d+                   return 'NUMBER' /* todo: more better */
[a-zA-Z]+   return 'JS_SYMBOL' /* todo: more better */
<<EOF>>               return 'EOF'
.                     return 'INVALID_CHAR'

/lex


%start expressions

%% /* language grammar */

expressions
    : config EOF
        {return $1;}
    ;

selector
    : SELECTOR_CLASS
    | SELECTOR_CLASS '[' QUOTED_STR ']'
    ;

comparison_operator
    : '<'
    | '>'
    | '='
    ;

test
    : selector comparison_operator HEALTH_STATUS
    | selector '.' selector comparison_operator HEALTH_STATUS
    ;

fn_ref
    : JS_SYMBOL
    | fn_ref '.' JS_SYMBOL
    ;

fn_param
    : QUOTED_STR
    | NUMBER
    | BOOLEAN
    | NULL
    | selector /* node and service instances can be passed */
    ;

fn_params
    : /* empty */
    | fn_param
    | fn_params ',' fn_param
    ;

reaction
    : fn_ref ';'
    | fn_ref '(' fn_params ')' ';'
    ;

reactions
    : reaction
    | reactions reaction
    ;

ruleset
    : test '{' ruleset '}'
    | test '{' reactions '}'
    ;

/* 
An overall configuration file can be a ruleset, or [all the preceding rulesets]
and a ruleset.
*/
config
    : ruleset
    | config ruleset
    ;
