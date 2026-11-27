#!/bin/bash
# musica tipo 8 bits para el juego de Bit, generada con ffmpeg (filtro aevalsrc)
# melodia de onda cuadrada + bajo + ruido para el ritmo, a 128 bpm
# dura 15 seg y empieza y acaba igual, asi que se puede poner en bucle sin cortes
set -e
cd "$(dirname "$0")"
C=0.234375   # duracion de una corchea a 128 bpm
mel=(659.25 783.99 880 987.77 880 783.99 659.25 587.33 659.25 783.99 987.77 1174.66 1046.5 987.77 880 783.99)
F="${mel[15]}"; for k in $(seq 14 -1 0); do F="if(lt(mod(t\,3.75)\,$(echo "$C*($k+1)" | bc))\,${mel[$k]}\,$F)"; done
baj=(82.41 82.41 65.41 65.41 98 98 73.42 73.42)
B="${baj[7]}"; for k in $(seq 6 -1 0); do B="if(lt(mod(t\,7.5)\,$(echo "0.9375*($k+1)" | bc))\,${baj[$k]}\,$B)"; done
ENV="(1-0.8*mod(t\,$C)/$C)"
MEL="0.12*$ENV*if(lt(mod(t*($F)\,1)\,0.25)\,1\,-1)"
BAJO="0.14*(1-0.7*mod(t\,0.46875)/0.46875)*if(lt(mod(t*($B)\,1)\,0.5)\,1\,-1)"
HAT="0.06*(2*random(0)-1)*lt(mod(t-$C\,0.46875)\,0.04)"
ffmpeg -loglevel error -y -f lavfi -i "aevalsrc=exprs='$MEL+$BAJO+$HAT':s=44100:d=15" -ac 1 -b:a 96k musica-bucle.mp3
ffmpeg -loglevel error -y -f lavfi -i "aevalsrc=exprs='$MEL+$BAJO+$HAT':s=44100:d=15" -ac 1 -c:a libvorbis -q:a 3 musica-bucle.ogg
echo "musica lista"
