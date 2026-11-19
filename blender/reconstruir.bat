@echo off
rem Reconstruye el modelo 3D: texturas -> Blender -> GLB -> archivo que carga la pagina.
rem Hay que ejecutarlo despues de cambiar blender\build_pc.py o las texturas.
cd /d "%~dp0"
python make_textures.py || goto :error
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup -P build_pc.py -- "%~dp0pc.glb" || goto :error
node -e "const fs=require('fs');const b=fs.readFileSync('pc.glb').toString('base64');fs.writeFileSync('../libs/pc-model.js','window.PC_GLB_B64=\''+b+'\';\n');console.log('Listo: libs/pc-model.js actualizado')" || goto :error
echo.
echo Modelo reconstruido. Recarga la pagina con Ctrl+F5.
goto :eof
:error
echo Algo fallo. Revisa los mensajes de arriba.
pause
