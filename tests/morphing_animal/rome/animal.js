/**
 * @author Mikael Emtinger
 */


ROME = {};


// animal

ROME.Animal = function( geometry, parseMorphTargetsNames ) {

	// construct
	var material = new THREE.MeshShaderMaterial( {
		uniforms: ROME.AnimalShader.uniforms(), 
		attributes: ROME.AnimalShader.attributes(),
		vertexShader: ROME.AnimalShader.vertex(), 
		fragmentShader: ROME.AnimalShader.fragment(),
		morphTargets: true,
		lights: true,
		fog: true
	} );

	
	// hack: attributes
	
	for( var i = 0; i < geometry.faces.length; i++ ) {
		
		material.attributes.colorAnimalA.value[ i ] = new THREE.Color( 0xff00ff );
		material.attributes.colorAnimalA.value[ i ].setRGB( Math.random() * 0.3 + 0.7, 0, 0 );
		
		material.attributes.colorAnimalB.value[ i ] = new THREE.Color( 0xff00ff );
		material.attributes.colorAnimalB.value[ i ].setRGB( Math.random() * 0.3 + 0.7, 0, Math.random() * 0.3 + 0.7 );


		if( geometry.faces[ i ] instanceof THREE.Face3 ) {
			
			material.attributes.contourUV.value.push( new THREE.Vector2( 0.0, 0.0 ));
			material.attributes.contourUV.value.push( new THREE.Vector2( 1.0, 0.0 ));
			material.attributes.contourUV.value.push( new THREE.Vector2( 1.0, 1.0 ));

			material.attributes.fakeAOUV.value.push( new THREE.Vector2( 0.0, 0.0 ));
			material.attributes.fakeAOUV.value.push( new THREE.Vector2( 1.0, 0.0 ));
			material.attributes.fakeAOUV.value.push( new THREE.Vector2( 1.0, 1.0 ));
			
		} else {
			
			material.attributes.contourUV.value.push( new THREE.Vector2( 0.0, 0.0 ));
			material.attributes.contourUV.value.push( new THREE.Vector2( 1.0, 0.0 ));
			material.attributes.contourUV.value.push( new THREE.Vector2( 1.0, 1.0 ));
			material.attributes.contourUV.value.push( new THREE.Vector2( 0.0, 1.0 ));

			material.attributes.fakeAOUV.value.push( new THREE.Vector2( 0.0, 0.0 ));
			material.attributes.fakeAOUV.value.push( new THREE.Vector2( 1.0, 0.0 ));
			material.attributes.fakeAOUV.value.push( new THREE.Vector2( 1.0, 1.0 ));
			material.attributes.fakeAOUV.value.push( new THREE.Vector2( 0.0, 1.0 ));
			
		}	
		
	}
	
	material.uniforms.contour.texture = ImageUtils.loadTexture( 'assets/faceContour.jpg' )
	material.uniforms.fakeAO.texture  = ImageUtils.loadTexture( 'assets/fakeAO.jpg' )
	
	
	// end hack!
	

	// random color to see the difference
	// material.uniforms.diffuse.value = new THREE.Color( Math.random() * 0xffffff );

	var that = {};
	that.mesh = new THREE.Mesh( geometry, material );
	that.morph = 0.0;
	that.animalA = { frames: undefined, currentFrame: 0, lengthInFrames: 0, currentTime: 0, lengthInMS: 0, timeScale: 1.0 };
	that.animalB = { frames: undefined, currentFrame: 0, lengthInFrames: 0, currentTime: 0, lengthInMS: 0, timeScale: 1.0 };
	that.availableAnimals = ROME.AnimalAnimationData.init( geometry, parseMorphTargetsNames );


	
	var isPlaying = false;
	var morphTargetOrder = that.mesh.morphTargetForcedOrder;


	//--- play ---

	that.play = function( animalA, animalB, morph, startTimeAnimalA, startTimeAnimalB ) {
		
		if( !isPlaying ) {

			isPlaying = true;
			that.morph = 0;

			THREE.AnimationHandler.addToUpdate( that );
		}
		
		setAnimalData( animalA, that.animalA );
		setAnimalData( animalB, that.animalB );
		
		that.animalA.currentTime = startTimeAnimalA ? startTimeAnimalA : 0;
		that.animalB.currentTime = startTimeAnimalB ? startTimeAnimalB : 0;
		
		that.update( 0 );
	} 


	//--- update ---
	
	that.update = function( deltaTimeMS ) {
		
		var data, dataNames = [ "animalA", "animalB" ];
		var d, dl;
		var f, fl;
		var frame, nextFrame;
		var time, nextTime;
		var unloopedTime;
		var lengthInMS;
		var lenghtInFrames;
		var morphTarget;
		var scale;
		
		for( d = 0, dl = dataNames.length, morphTarget = 0; d < dl; d++ ) {
			
			data = that[ dataNames[ d ]];
			
			unloopedTime = data.currentTime;
			data.currentTime = ( data.currentTime + deltaTimeMS * data.timeScale ) % data.lengthInMS;


			// did we loop?

			if( unloopedTime > data.currentTime ) {

				data.currentFrame = 0;				

			}


			// find frame/nextFrame
			

			frame = 0;
			
			for( f = data.currentFrame, fl = data.lengthInFrames - 1; f < fl; f++ ) {
				
				if( data.currentTime >= data.frames[ f ].time && data.currentTime < data.frames[ f + 1 ].time ) {
					
					frame = f;
					break;
				}
			}

			data.currentFrame = frame;
			nextFrame = frame + 1 < fl ? frame + 1 : 0;

			
			morphTargetOrder[ morphTarget++ ] = data.frames[ frame     ].index;
			morphTargetOrder[ morphTarget++ ] = data.frames[ nextFrame ].index;
			
			time     = data.frames[ frame     ].time;
			nextTime = data.frames[ nextFrame ].time > time ? data.frames[ nextFrame ].time : data.frames[ nextFrame ].time + data.lengthInMS; 
			
			scale = ( data.currentTime - time ) / ( nextTime - time ) ;
			
			material.uniforms[ dataNames[ d ] + "Interpolation" ].value = scale;

		}

		material.uniforms.animalMorphValue.value = that.morph;
	}


	//--- set new target animal ---
	
	that.setNewTargetAnimal = function( animal, startTimeAnimalB ) {
		
		if( that.morph === 1 ) {
			
			// switch so B -> A
			
			for( var property in that.animalA ) {
				
				that.animalA[ property ] = that.animalB[ property ];
				
			}
			
			
			// set new B and change morph
			
			that.animalB.currentTime = startTimeAnimalB ? startTimeAnimalB : 0;
			setAnimalData( animal, that.animalB );
			setFrame( that.animalB );
			that.morph = 0;
			
		}
		else {
			
			console.log( "Error: Cannot change animal target if morph != 1. Skipping." );
		}
		
	}


	//--- set animal data ---

	var setAnimalData = function( name, data ) {
		
		if( ROME.AnimalAnimationData[ name ] !== undefined ) {
			
			data.frames         = ROME.AnimalAnimationData[ name ];
			data.lengthInFrames = data.frames.length;
			data.lengthInMS     = data.frames[ data.lengthInFrames - 1 ].time;
			
		} else {
			
			console.log( "Error: Couldn't find data for animal " + name );
			
		}
		
	}
	
	
	//--- set frame ---
	
	var setFrame = function( data ) {
		
		var f, fl;
		var currentTime = data.currentTime;
		var frames = data.frames;
		
		for( f = 0, fl < frames.length; f < fl; f++ ) {
			
			if( currentTime >= frames[ f ].time ) {
				
				data.currentFrame = f;
				return;
				
			}
			
		}
		
	}


	//--- set current frame ---
	
	var setCurrentFrame = function( data ) {
		
				

	}

	
	//--- return public ---
	
	return that;
}



// shader

ROME.AnimalShader = {
	
	uniforms: function () {

		return {
					"animalAInterpolation": 		{ type: "f", value: 0.0 },
					"animalBInterpolation": 		{ type: "f", value: 0.0 },
					"animalMorphValue" :    		{ type: "f", value: 0.0 },
					
					"fogColor": 					{ type: "c", value: new THREE.Color() },
					"fogDensity": 					{ type: "f", value: 0 },

					"enableLighting": 				{ type: "i", value: 1 },
					"ambientLightColor": 			{ type: "fv", value: [] },
					"directionalLightDirection": 	{ type: "fv", value: [] },
					"directionalLightColor": 		{ type: "fv", value: [] },
					"pointLightColor": 				{ type: "fv", value: [] },
					"pointLightPosition": 			{ type: "fv", value: [] },
					"pointLightDistance": 			{ type: "fv1", value: [] },
					
					"contour": 						{ type: "t", value: 0, texture: undefined },
					"fakeAO":                       { type: "t", value: 1, texture: undefined }

			   }
	},
	
	attributes: function() {
		
		return {
			
			"colorAnimalA": 	{ type: "c", boundTo:"faces", value:[] },
			"colorAnimalB": 	{ type: "c", boundTo:"faces", value:[] },
			"contourUV": 		{ type: "v2", boundTo: "faceVertices", value:[] },
			"fakeAOUV": 		{ type: "v2", boundTo: "faceVertices", value:[] },
			
		}
		
	},

	vertex: function () { return[

		"uniform 	float	animalAInterpolation;",
		"uniform 	float	animalBInterpolation;",
		"uniform 	float	animalMorphValue;",

		"uniform 	vec3 	ambientLightColor;",
		"uniform 	vec3 	directionalLightColor[ MAX_DIR_LIGHTS ];",
		"uniform 	vec3 	directionalLightDirection[ MAX_DIR_LIGHTS ];",

		"attribute	vec3	colorAnimalA;",
		"attribute	vec3	colorAnimalB;",
		"attribute	vec2	contourUV;",
		"attribute	vec2	fakeAOUV;",

		"varying 	vec3 	vLightWeighting;",
		"varying 	vec2	vContourUV;",
		"varying 	vec2	vfakeAOUV;",
		"varying	vec3	vColor;",

		"void main() {",

			// light

			"vLightWeighting = ambientLightColor;",

			"vec3 transformedNormal = normalize( normalMatrix * normal );",
			"vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ 0 ], 0.0 );",
			"float directionalLightWeighting = max( dot( transformedNormal, normalize( lDirection.xyz ) ), 0.0 );",
			"vLightWeighting += directionalLightColor[ 0 ] * directionalLightWeighting;",

			// uv
			
			"vContourUV = contourUV;",
			"vfakeAOUV = fakeAOUV;",


			// morph
			
			"vColor = mix( colorAnimalA, colorAnimalB, animalMorphValue );",
			
			"vec3 animalA = mix( morphTarget0, morphTarget1, animalAInterpolation );",
			"vec3 animalB = mix( morphTarget2, morphTarget3, animalBInterpolation );",
			"vec3 morphed = mix( animalA,      animalB,      animalMorphValue );",
			
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( morphed, 1.0 );",
		"}"

	].join("\n")},

	fragment: function () { return[

		"uniform 	sampler2D 	contour;",
		"uniform 	sampler2D 	fakeAO;",

		"uniform 	vec3 		fogColor;",
		"uniform 	float 		fogDensity;",

		"varying 	vec3 		vLightWeighting;",
		"varying	vec3		vColor;",
		"varying 	vec2		vContourUV;",
		"varying 	vec2		vfakeAOUV;",

		"void main() {",

			"float depth = gl_FragCoord.z / gl_FragCoord.w;",
			"const float LOG2 = 1.442695;",
			
			"float fogFactor = exp2( -fogDensity * fogDensity * depth * depth * LOG2 );",
			"fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );",

			"gl_FragColor = vec4( vColor, 1.0 ) * texture2D( contour, vContourUV );",
			"gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );",
			"gl_FragColor = gl_FragColor * vec4( vLightWeighting, 1.0 );",

		"}"

	].join("\n") }
}


// animation data

ROME.AnimalAnimationData = {

	// static animal names (please fill in as it's faster than parsing through the geometry.morphTargets

	animalNames: [ "horse", "mountainlion", "wolf", "fox", "deer", "parrot", "eagle", "vulture", "raven" ],


	// init frame times and indices
	
	init: function( geometry, parseMorphTargetNames ) {
		
		var availableAnimals = [];
		var animal, animalName;
		var charCode, morphTargetName, morphTargets = geometry.morphTargets;
		var a, al, m, ml, currentTime;
		
		// add animal names to static list?
		
		if( parseMorphTargetNames ) {
			
			for( m = 0, ml = morphTargets.length; m < ml; m++ ) {
								
				// check so not already exists
				
				for( a = 0, al = this.animalNames.length; a < al; a++ ) {
					
					animalName = this.animalNames[ a ];
					
					if( morphTargets[ m ].name.indexOf( animalName ) !== -1 ) {
						
						break;
					}
					
				}
				
				
				// did not exist?
				
				if( a === al ) {
					
					morphTargetName = morphTargets[ m ].name;
					
					for( a = 0; a < morphTargetName.length; a++ ) {
				
						charCode = morphTargetName.charCodeAt( a );
						
						if(! (( charCode >= 65 && charCode <= 90  ) ||
						      ( charCode >= 97 && charCode <= 122 ))) {
						      	
							break;      	

						} 
						
					}
					
					this.animalNames.push( morphTargetName.slice( 0, a ));
					
				}
				
			}
			
		}
				
		// parse out the names
		
		for( a = 0, al = this.animalNames.length; a < al; a++ ) {
			
			animalName  = this.animalNames[ a ];
			animal      = this[ animalName ];
			currentTime = 0;
			
			if( animal === undefined || animal.length === 0 ) {
				
				animal = this[ animalName ] = [];
				
				for( m = 0, ml = morphTargets.length; m < ml; m++ ) {
	
					if( morphTargets[ m ].name.indexOf( animalName ) !== -1 ) {

						animal.push( { index: m, time: currentTime } );
						currentTime += parseInt( 1000 / 24, 10 );		// 24 fps			
						
	
						if( availableAnimals.indexOf( animalName ) === -1 ) {
							
							availableAnimals.push( animalName );
							
						}
						
					}
					
				}

			} else {
				
				for( m = 0, ml = morphTargets.length; m < ml; m++ ) {
					
					if( availableAnimals.indexOf( animalName ) === -1 && morphTargets[ m ].name.indexOf( animalName ) !== -1 ) {
						
						availableAnimals.push( animalName );
						
					}
					
				}
				
			}
			 
		}

		return availableAnimals;

	}
	
}


