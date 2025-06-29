import { ref, onUnmounted, readonly } from 'vue';
import { useErrorHandler } from './useErrorHandler';
import { AUDIO_CONSTANTS } from '~/constants';

export function useAudio() {
  const { handleError } = useErrorHandler();

  // Audio components
  const synth = ref<any | null>(null);
  const reverb = ref<any | null>(null);
  const delay = ref<any | null>(null);
  const masterVolume = ref<any | null>(null);

  // State
  const isInitialized = ref(false);
  const isContextStarted = ref(false);
  const currentVolume = ref(AUDIO_CONSTANTS.DEFAULT_MASTER_VOLUME);
  const isInitializing = ref(false);

  // Tone.js reference
  let Tone: any = null;

  /**
   * Dynamically import Tone.js (client-side only)
   */
  const loadTone = async () => {
    if (!process.client) {
      throw new Error('Tone.js can only be loaded on the client-side');
    }

    if (!Tone) {
      Tone = await import('tone');
    }
    return Tone;
  };

  /**
   * Check if user interaction is required for audio context
   */
  const checkUserInteractionRequired = async (): Promise<boolean> => {
    if (!process.client) return false;

    try {
      await loadTone();
      return Tone.context.state === 'suspended';
    } catch (err) {
      console.warn('Could not check audio context state:', err);
      return true;
    }
  };

  /**
   * Initialize the audio context and start Tone.js with proper error handling
   */
  const startAudioContext = async (): Promise<boolean> => {
    try {
      if (!process.client) {
        console.warn('Audio context can only be started on the client-side');
        return false;
      }

      await loadTone();

      // Check current context state
      console.log('Current audio context state:', Tone.context.state);

      // If context is already running, we're good
      if (Tone.context.state === 'running') {
        isContextStarted.value = true;
        return true;
      }

      // If context is suspended, try to resume it
      if (Tone.context.state === 'suspended') {
        console.log('Resuming suspended audio context...');
        await Tone.context.resume();
      }

      // Start Tone.js - this handles the user interaction requirement
      console.log('Starting Tone.js...');
      await Tone.start();

      // Wait longer for context to fully stabilize
      console.log('Waiting for audio context to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to resume the context again to ensure it's running
      if (Tone.context.state !== 'running') {
        console.log('Audio context not running after start, attempting to resume...');
        await Tone.context.resume();

        // Wait a bit more after resume
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Verify the context is now running
      if (Tone.context.state === 'running') {
        console.log('Audio context started successfully');
        isContextStarted.value = true;
        return true;
      } else {
        throw new Error(`Audio context failed to start. State: ${Tone.context.state}`);
      }

    } catch (err) {
      const error = err as Error;
      console.error('Failed to start audio context:', error);

      // Provide more specific error messages
      if (error.name === 'InvalidStateError') {
        handleError(new Error('Audio context is in an invalid state. Please try refreshing the page and clicking the button again.'), 'Audio context startup');
      } else if (error.name === 'NotAllowedError') {
        handleError(new Error('Audio access was denied. Please check your browser permissions and try again.'), 'Audio permissions');
      } else {
        handleError(error, 'Failed to start audio context');
      }
      return false;
    }
  };

  /**
   * Safely dispose of an audio node
   */
  const safeDispose = (node: any, name: string) => {
    try {
      if (!node) {
        console.log(`No ${name} node to dispose, already null`);
        return;
      }

      if (typeof node.dispose !== 'function') {
        console.log(`${name} node does not have a dispose method`);
        return;
      }

      // Disconnect the node before disposing to prevent connection errors
      if (typeof node.disconnect === 'function') {
        try {
          node.disconnect();
          console.log(`Disconnected ${name} node`);
        } catch (disconnectErr) {
          console.warn(`Error disconnecting ${name} node:`, disconnectErr);
          // Continue with disposal even if disconnect fails
        }
      }

      // Now dispose the node
      node.dispose();
      console.log(`Successfully disposed ${name} node`);
    } catch (err) {
      console.warn(`Error disposing ${name}:`, err);
      // Don't throw the error further to prevent cascading failures
    }
  };

  /**
   * Initialize the basic Synth with specified parameters and proper error handling
   * Simplified version that avoids complex effects chain to prevent browser freezing
   */
  const initializeSynth = async (): Promise<boolean> => {
    try {
      if (!process.client) {
        console.warn('Synth can only be initialized on the client-side');
        return false;
      }

      // Ensure Tone.js is loaded
      await loadTone();

      // Verify audio context is running before creating synth
      if (Tone.context.state !== 'running') {
        console.log('Audio context not running, attempting to resume...');
        await Tone.context.resume();
        await new Promise(resolve => setTimeout(resolve, 300));

        if (Tone.context.state !== 'running') {
          throw new Error(`Cannot initialize Synth: Audio context state is "${Tone.context.state}". Expected "running".`);
        }
      }

      // Dispose any existing audio nodes before creating new ones
      console.log('Cleaning up any existing audio nodes...');
      safeDispose(synth.value, 'synth');
      safeDispose(delay.value, 'delay');
      safeDispose(reverb.value, 'reverb');
      safeDispose(masterVolume.value, 'volume');

      // Reset references
      synth.value = null;
      delay.value = null;
      reverb.value = null;
      masterVolume.value = null;

      // Add a small delay after cleanup
      await new Promise(resolve => setTimeout(resolve, 200));

      // SIMPLIFIED APPROACH: Create only essential components and connect them directly
      // This avoids the complex effects chain that causes browser freezing

      console.log('Creating basic Synth...');

      // Create a specific timeout for synth creation to prevent hanging
      // Use a more robust approach with multiple fallback options
      console.log('Preparing to create Synth with fallback options...');

      // First attempt: Try to create a Synth with minimal parameters
      let synthCreated = false;
      let creationError = null;

      // Set up a watchdog timer that will detect if we're frozen
      const watchdogTimerId = window.setTimeout(() => {
        console.error('WATCHDOG: Synth creation appears to be frozen');
        // We can't do anything here if truly frozen, but this helps with debugging
      }, 1000);

      try {
        console.log('ATTEMPT 1: Creating standard Synth...');

        // Use a more aggressive timeout for just the constructor call
        const constructorPromise = new Promise<void>((resolve, reject) => {
          try {
            // Log immediately before the constructor call
            console.log('About to call Tone.Synth constructor...');

            // Create with absolute minimal parameters
            synth.value = new Tone.Synth({
              oscillator: { type: "sine" },
              envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.4 }
            });

            // Log immediately after constructor returns
            console.log('Tone.Synth constructor returned successfully');
            resolve();
          } catch (err) {
            console.error('Error in Synth constructor:', err);
            reject(err);
          }
        });

        // Use a shorter timeout for just the constructor call
        await Promise.race([
          constructorPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Synth constructor timed out after 1 second')), 1000)
          )
        ]);

        console.log('Synth object created successfully');
        synthCreated = true;
      } catch (err) {
        creationError = err;
        console.warn('First synth creation attempt failed:', err);
      }

      // Clear the watchdog timer
      if (watchdogTimerId) {
        window.clearTimeout(watchdogTimerId);
      }

      // If first attempt failed, try a fallback approach
      if (!synthCreated) {
        try {
          console.log('ATTEMPT 2: Creating fallback Synth with default parameters...');

          // Try creating with default parameters (no custom options)
          synth.value = new Tone.Synth();
          console.log('Fallback Synth created successfully');
          synthCreated = true;
        } catch (err) {
          console.warn('Second synth creation attempt failed:', err);

          // If both attempts failed, throw the original error
          throw new Error(`Failed to create Synth object: ${creationError instanceof Error ? creationError.message : String(creationError)}`);
        }
      }

      console.log('Synth created successfully');

      console.log('Creating master volume control...');

      // Create master volume with timeout protection
      let volumeCreated = false;
      try {
        // Set up a watchdog timer for volume creation
        const volumeWatchdogId = window.setTimeout(() => {
          console.error('WATCHDOG: Volume creation appears to be frozen');
        }, 1000);

        // Create volume with timeout protection
        const volumePromise = new Promise<void>((resolve, reject) => {
          try {
            console.log('About to create Tone.Volume...');
            masterVolume.value = new Tone.Volume(-6);
            console.log('Tone.Volume constructor returned successfully');
            resolve();
          } catch (err) {
            console.error('Error creating Volume object:', err);
            reject(err);
          }
        });

        // Use a short timeout for volume creation
        await Promise.race([
          volumePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Volume creation timed out after 1 second')), 1000)
          )
        ]);

        // Clear the watchdog timer
        window.clearTimeout(volumeWatchdogId);

        console.log('Master volume created successfully');
        volumeCreated = true;
      } catch (volumeError) {
        console.warn('Failed to create Tone.Volume:', volumeError);

        // Try a simpler approach as fallback
        try {
          console.log('FALLBACK: Creating simple gain node instead of Tone.Volume...');
          // Use the Web Audio API directly as a last resort
          const ctx = Tone.context.rawContext;
          const gainNode = ctx.createGain();
          gainNode.gain.value = 0.5; // -6dB equivalent

          // Create a wrapper object that mimics the Tone.Volume interface
          masterVolume.value = {
            _gainNode: gainNode,
            toDestination: function() {
              this._gainNode.connect(ctx.destination);
            },
            connect: function(node) {
              if (node._gainNode) {
                this._gainNode.connect(node._gainNode);
              } else {
                this._gainNode.connect(node.input || node);
              }
            },
            dispose: function() {
              this._gainNode.disconnect();
            }
          };

          console.log('Fallback gain node created successfully');
          volumeCreated = true;
        } catch (fallbackError) {
          console.error('Even fallback volume creation failed:', fallbackError);
          throw new Error('Could not create any type of volume control');
        }
      }

      // Connect synth directly to master volume and then to destination
      // This is the simplest possible audio chain
      console.log('Connecting basic audio chain...');

      // Add specific error handling for the connection step with timeouts
      try {
        // Set up a watchdog timer for the connection process
        const connectionWatchdogId = window.setTimeout(() => {
          console.error('WATCHDOG: Audio connection appears to be frozen');
        }, 1000);

        // Connect with timeout protection
        const connectionPromise = new Promise<void>(async (resolve, reject) => {
          try {
            console.log('Connecting synth to master volume...');
            synth.value.connect(masterVolume.value);
            console.log('Synth connected to master volume');

            // Small delay between connections
            await new Promise(r => setTimeout(r, 50));

            console.log('Connecting master volume to destination...');
            masterVolume.value.toDestination();
            console.log('Master volume connected to destination');

            resolve();
          } catch (err) {
            console.error('Error in connection process:', err);
            reject(err);
          }
        });

        // Use a short timeout for the connection process
        await Promise.race([
          connectionPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Audio connection timed out after 2 seconds')), 2000)
          )
        ]);

        // Clear the watchdog timer
        window.clearTimeout(connectionWatchdogId);

        console.log('Basic audio chain connected successfully');
      } catch (connectionError) {
        console.error('Error connecting audio chain:', connectionError);

        // Try a direct connection as a last resort
        try {
          console.log('FALLBACK: Attempting direct connection to destination...');

          // Disconnect everything first
          try {
            if (typeof synth.value.disconnect === 'function') {
              synth.value.disconnect();
            }
            if (typeof masterVolume.value.disconnect === 'function') {
              masterVolume.value.disconnect();
            }
          } catch (disconnectErr) {
            console.warn('Error during disconnect (non-fatal):', disconnectErr);
          }

          // Try connecting synth directly to destination
          synth.value.toDestination();
          console.log('Fallback direct connection successful');
        } catch (fallbackConnectionError) {
          console.error('Even fallback connection failed:', fallbackConnectionError);
          throw new Error(`Failed to connect audio chain: ${connectionError instanceof Error ? connectionError.message : String(connectionError)}`);
        }
      }

      // Set initialized state
      console.log('Audio system initialized successfully with basic functionality');
      isInitialized.value = true;
      return true;

    } catch (err) {
      const error = err as Error;
      console.error('Synth initialization failed:', error);

      // Clean up any partially created objects safely
      console.log('Cleaning up after initialization failure...');
      safeDispose(synth.value, 'synth');
      safeDispose(masterVolume.value, 'volume');

      // Reset references
      synth.value = null;
      masterVolume.value = null;

      // Reset state
      isInitialized.value = false;

      handleError(error, 'Failed to initialize Synth');
      return false;
    }
  };

  /**
   * Initialize the complete audio system with proper sequencing
   */
  const initializeAudioSystem = async (): Promise<boolean> => {
    if (isInitializing.value) {
      console.log('Audio system initialization already in progress...');
      return false;
    }

    // Create a series of progressive timeouts with detailed logging
    const timeouts: { id: number | null, time: number }[] = [];

    // Create a standard timeout promise (shorter than before)
    let timeoutId: number | null = null;
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        console.error('TIMEOUT: Audio system initialization timed out after 8 seconds');
        reject(new Error('Audio system initialization timed out after 8 seconds'));
      }, 8000); // 8 second timeout - reduced from 10s for faster response

      timeouts.push({ id: timeoutId, time: 8000 });
    });

    // Create a series of progress check timeouts to help identify where freezing occurs
    const progressTimeouts: number[] = [];

    // 2-second check
    progressTimeouts.push(window.setTimeout(() => {
      console.log('PROGRESS CHECK (2s): Audio initialization in progress...');
    }, 2000));

    // 4-second check with warning
    progressTimeouts.push(window.setTimeout(() => {
      console.warn('PROGRESS CHECK (4s): Audio initialization taking longer than expected...');
    }, 4000));

    // 6-second check with error
    progressTimeouts.push(window.setTimeout(() => {
      console.error('PROGRESS CHECK (6s): Audio initialization may be frozen or extremely slow');
    }, 6000));

    // Create a hard timeout that will force cleanup even if other timeouts fail
    let hardTimeoutId: number | null = null;
    const hardTimeoutPromise = new Promise<boolean>((_, reject) => {
      hardTimeoutId = window.setTimeout(() => {
        console.error('HARD TIMEOUT: Forcing audio initialization termination after 10 seconds');
        // Force cleanup of any audio resources that might be causing the freeze
        try {
          console.log('Performing emergency cleanup of audio resources...');

          // Try to disconnect everything first
          try {
            if (synth.value && typeof synth.value.disconnect === 'function') {
              synth.value.disconnect();
              console.log('Emergency disconnect of synth completed');
            }

            if (masterVolume.value && typeof masterVolume.value.disconnect === 'function') {
              masterVolume.value.disconnect();
              console.log('Emergency disconnect of volume completed');
            }
          } catch (disconnectErr) {
            console.warn('Error during emergency disconnect:', disconnectErr);
          }

          // Now dispose everything
          if (synth.value) safeDispose(synth.value, 'synth (hard timeout)');
          if (delay.value) safeDispose(delay.value, 'delay (hard timeout)');
          if (reverb.value) safeDispose(reverb.value, 'reverb (hard timeout)');
          if (masterVolume.value) safeDispose(masterVolume.value, 'volume (hard timeout)');

          // Reset all references
          synth.value = null;
          delay.value = null;
          reverb.value = null;
          masterVolume.value = null;

          // Reset state
          isInitialized.value = false;
          isContextStarted.value = false;
          isInitializing.value = false;

          console.log('Emergency cleanup completed');
        } catch (e) {
          console.error('Error during hard timeout cleanup:', e);
        }
        reject(new Error('Audio initialization force-terminated to prevent browser freezing'));
      }, 10000); // 10 second hard timeout - reduced from 12s

      timeouts.push({ id: hardTimeoutId, time: 10000 });
    });

    try {
      if (!process.client) {
        console.warn('Audio system can only be initialized on the client-side');
        return false;
      }

      isInitializing.value = true;
      console.log('Starting audio system initialization...');

      // Step 1: Start the audio context
      console.log('Step 1: Starting audio context...');
      const contextStarted = await startAudioContext();
      if (!contextStarted) {
        throw new Error('Failed to start audio context');
      }

      // Step 2: Wait for context to fully stabilize
      console.log('Step 2: Waiting for audio context to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2.5: Verify context is still running
      if (Tone.context.state !== 'running') {
        console.log('Audio context not in running state, attempting to resume again...');
        await Tone.context.resume();
        await new Promise(resolve => setTimeout(resolve, 300));

        if (Tone.context.state !== 'running') {
          throw new Error(`Cannot proceed with initialization: Audio context state is "${Tone.context.state}" after multiple resume attempts`);
        }
      }

      // Step 3: Initialize the Synth with timeout protection
      console.log('Step 3: Initializing Synth...');

      // Race between initialization, regular timeout, and hard timeout
      let synthInitialized = false;
      try {
        synthInitialized = await Promise.race([
          initializeSynth(),
          timeoutPromise,
          hardTimeoutPromise
        ]) as boolean;
      } catch (synthError) {
        console.error('Standard synth initialization failed:', synthError);

        // Last resort: Create an extremely simple audio system using Web Audio API directly
        console.log('LAST RESORT: Attempting to create minimal audio system using Web Audio API directly...');

        try {
          // Clear any existing audio components
          safeDispose(synth.value, 'synth');
          safeDispose(masterVolume.value, 'volume');
          synth.value = null;
          masterVolume.value = null;

          // Create minimal audio system using Web Audio API
          const ctx = Tone.context.rawContext || new AudioContext();

          // Create a simple oscillator as our synth
          const dummyOscillator = ctx.createOscillator();
          dummyOscillator.type = 'sine';
          dummyOscillator.frequency.value = 440; // A4

          // Create a gain node for volume control
          const dummyGain = ctx.createGain();
          dummyGain.gain.value = 0.5;

          // Connect oscillator to gain node
          dummyOscillator.connect(dummyGain);

          // Connect gain node to destination
          dummyGain.connect(ctx.destination);

          // Create wrapper objects that mimic Tone.js interfaces
          synth.value = {
            _oscillator: dummyOscillator,
            _gain: dummyGain,
            _ctx: ctx,
            _playing: false,
            triggerAttackRelease: function(frequency: number | string, duration: string, time?: number, velocity?: number) {
              try {
                // Convert frequency from string to number if needed
                let freq = typeof frequency === 'string' ? 
                  440 * Math.pow(2, (this._noteToMidi(frequency) - 69) / 12) : 
                  frequency;

                // Set oscillator frequency
                this._oscillator.frequency.value = freq;

                // Set gain based on velocity
                this._gain.gain.value = velocity || 0.5;

                // Start oscillator if not already playing
                if (!this._playing) {
                  this._oscillator.start();
                  this._playing = true;
                }

                // Stop after duration (approximate conversion from musical notation)
                const durationMs = this._durationToMs(duration);
                setTimeout(() => {
                  this._gain.gain.value = 0;
                }, durationMs);
              } catch (err) {
                console.warn('Error in minimal synth triggerAttackRelease:', err);
              }
            },
            _noteToMidi: function(note: string): number {
              // Very basic note to MIDI conversion
              const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
              const octave = parseInt(note.slice(-1));
              const noteName = note.slice(0, -1);
              const noteIndex = notes.indexOf(noteName);

              if (noteIndex === -1) return 69; // A4 as fallback
              return 12 * (octave + 1) + noteIndex;
            },
            _durationToMs: function(duration: string): number {
              // Very basic duration conversion
              switch(duration) {
                case '4n': return 500; // quarter note
                case '8n': return 250; // eighth note
                case '16n': return 125; // sixteenth note
                default: return 250;
              }
            },
            connect: function() { /* No-op, already connected */ },
            disconnect: function() {
              try {
                this._gain.disconnect();
              } catch (err) {
                console.warn('Error disconnecting minimal synth:', err);
              }
            },
            dispose: function() {
              try {
                if (this._playing) {
                  this._oscillator.stop();
                  this._playing = false;
                }
                this._gain.disconnect();
              } catch (err) {
                console.warn('Error disposing minimal synth:', err);
              }
            }
          };

          // Create a simple volume control
          masterVolume.value = {
            _gain: dummyGain,
            toDestination: function() { /* No-op, already connected */ },
            connect: function() { /* No-op, already connected */ },
            disconnect: function() {
              try {
                this._gain.disconnect();
              } catch (err) {
                console.warn('Error disconnecting minimal volume:', err);
              }
            },
            dispose: function() {
              try {
                this._gain.disconnect();
              } catch (err) {
                console.warn('Error disposing minimal volume:', err);
              }
            }
          };

          console.log('Minimal audio system created successfully');
          synthInitialized = true;
          isInitialized.value = true;

          // Set a flag to indicate we're using the minimal audio system
          // This can be used by the UI to show appropriate messages
          window._usingMinimalAudioSystem = true;
        } catch (minimalError) {
          console.error('Even minimal audio system creation failed:', minimalError);
          throw new Error('Failed to initialize any type of audio system');
        }
      }

      if (!synthInitialized) {
        throw new Error('Failed to initialize Synth');
      }

      console.log('Audio system initialization completed successfully');
      return true;

    } catch (err) {
      const error = err as Error;
      console.error('Audio system initialization failed:', error);

      // Reset state on failure
      isInitialized.value = false;
      isContextStarted.value = false;

      // Clean up any partially initialized components
      console.log('Cleaning up after failed initialization...');
      safeDispose(synth.value, 'synth');
      safeDispose(delay.value, 'delay');
      safeDispose(reverb.value, 'reverb');
      safeDispose(masterVolume.value, 'volume');

      // Reset references
      synth.value = null;
      delay.value = null;
      reverb.value = null;
      masterVolume.value = null;

      // Provide more specific error message for timeout
      if (error.message.includes('timed out')) {
        handleError(new Error('Audio initialization timed out. This could be due to browser restrictions or performance issues. Please try refreshing the page.'), 'Audio system timeout');
      } else {
        handleError(error, 'Failed to initialize audio system');
      }
      return false;
    } finally {
      console.log('Cleaning up timeouts...');

      // Clear all standard timeouts
      timeouts.forEach(timeout => {
        if (timeout.id !== null) {
          window.clearTimeout(timeout.id);
          console.log(`Cleared ${timeout.time}ms timeout`);
        }
      });

      // Clear all progress check timeouts
      progressTimeouts.forEach(id => {
        window.clearTimeout(id);
      });
      console.log('Cleared all progress check timeouts');

      // Only reset initializing flag if it wasn't already reset by the hard timeout
      if (isInitializing.value) {
        isInitializing.value = false;
        console.log('Reset initializing flag');
      }

      console.log('Audio initialization process completed (success or failure)');
    }
  };

  /**
   * Trigger a note with specified frequency and duration
   */
  const triggerNote = (frequency: string | number, duration: string = "8n", velocity: number = 0.8): void => {
    try {
      if (!process.client || !synth.value || !isInitialized.value) {
        console.warn('Synth not initialized or not on client-side');
        return;
      }

      // Verify audio context is still running
      if (Tone && Tone.context.state !== 'running') {
        console.warn('Audio context is not running. Current state:', Tone.context.state);
        return;
      }

      // Clamp velocity between 0 and 1
      const clampedVelocity = Math.max(0, Math.min(1, velocity));

      // Trigger the note
      synth.value.triggerAttackRelease(frequency, duration, undefined, clampedVelocity);

    } catch (err) {
      handleError(err as Error, 'Failed to trigger note');
    }
  };

  /**
   * Trigger attack only (for sustained notes)
   */
  const triggerAttack = (frequency: string | number, velocity: number = 0.8): void => {
    try {
      if (!process.client || !synth.value || !isInitialized.value) {
        console.warn('Synth not initialized or not on client-side');
        return;
      }

      if (Tone && Tone.context.state !== 'running') {
        console.warn('Audio context is not running. Current state:', Tone.context.state);
        return;
      }

      const clampedVelocity = Math.max(0, Math.min(1, velocity));
      synth.value.triggerAttack(frequency, undefined, clampedVelocity);

    } catch (err) {
      handleError(err as Error, 'Failed to trigger attack');
    }
  };

  /**
   * Trigger release for sustained notes
   */
  const triggerRelease = (): void => {
    try {
      if (!process.client || !synth.value || !isInitialized.value) {
        console.warn('Synth not initialized or not on client-side');
        return;
      }

      if (Tone && Tone.context.state !== 'running') {
        console.warn('Audio context is not running. Current state:', Tone.context.state);
        return;
      }

      synth.value.triggerRelease();

    } catch (err) {
      handleError(err as Error, 'Failed to trigger release');
    }
  };

  /**
   * Update master volume
   */
  const setVolume = (volume: number): void => {
    try {
      if (!process.client || !masterVolume.value) return;

      // Clamp volume between 0 and 1, convert to dB
      const clampedVolume = Math.max(0, Math.min(1, volume));
      const volumeDb = clampedVolume === 0 ? -Infinity : Tone.gainToDb(clampedVolume);

      masterVolume.value.volume.rampTo(volumeDb, 0.1);
      currentVolume.value = clampedVolume;

    } catch (err) {
      handleError(err as Error, 'Failed to set volume');
    }
  };

  /**
   * Update reverb settings
   * Note: In the simplified audio system, reverb is not used to prevent browser freezing
   */
  const setReverbWet = (wetness: number): void => {
    try {
      // In the simplified audio system, reverb is not initialized
      // This method is kept for API compatibility
      if (!process.client || !reverb.value) {
        console.log('Reverb effect is disabled in simplified audio system');
        return;
      }

      const clampedWet = Math.max(0, Math.min(1, wetness));
      reverb.value.wet.rampTo(clampedWet, 0.1);

    } catch (err) {
      // Don't show error to user since reverb is intentionally disabled
      console.warn('Failed to set reverb (disabled in simplified audio system):', err);
    }
  };

  /**
   * Update delay settings
   * Note: In the simplified audio system, delay is not used to prevent browser freezing
   */
  const setDelayWet = (wetness: number): void => {
    try {
      // In the simplified audio system, delay is not initialized
      // This method is kept for API compatibility
      if (!process.client || !delay.value) {
        console.log('Delay effect is disabled in simplified audio system');
        return;
      }

      const clampedWet = Math.max(0, Math.min(1, wetness));
      delay.value.wet.rampTo(clampedWet, 0.1);

    } catch (err) {
      // Don't show error to user since delay is intentionally disabled
      console.warn('Failed to set delay (disabled in simplified audio system):', err);
    }
  };

  /**
   * Update Synth parameters
   * Note: In the simplified audio system, we use a basic Synth instead of FMSynth
   */
  const updateSynthParams = (params: Partial<{
    harmonicity: number; // Kept for API compatibility but not used
    modulationIndex: number; // Kept for API compatibility but not used
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  }>): void => {
    try {
      if (!process.client || !synth.value) return;

      // Note: harmonicity and modulationIndex are ignored in the simplified Synth
      // Log a message for debugging
      if (params.harmonicity !== undefined || params.modulationIndex !== undefined) {
        console.log('harmonicity and modulationIndex are not available in simplified Synth');
      }

      // Use the set method for envelope parameters instead of direct assignment
      const envelopeParams: any = {};

      if (params.attack !== undefined) {
        envelopeParams.attack = params.attack;
      }

      if (params.decay !== undefined) {
        envelopeParams.decay = params.decay;
      }

      if (params.sustain !== undefined) {
        envelopeParams.sustain = params.sustain;
      }

      if (params.release !== undefined) {
        envelopeParams.release = params.release;
      }

      // Apply envelope parameters if any were provided
      if (Object.keys(envelopeParams).length > 0) {
        synth.value.envelope.set(envelopeParams);
      }

    } catch (err) {
      // Log error but don't show to user since this is expected with the simplified synth
      console.warn('Failed to update synth parameters:', err);
    }
  };

  /**
   * Dispose of all audio resources
   */
  const dispose = (): void => {
    try {
      if (!process.client) return;

      console.log('Disposing audio resources...');

      // Dispose in reverse order of creation
      safeDispose(masterVolume.value, 'volume');
      masterVolume.value = null;

      safeDispose(reverb.value, 'reverb');
      reverb.value = null;

      safeDispose(delay.value, 'delay');
      delay.value = null;

      safeDispose(synth.value, 'synth');
      synth.value = null;

      isInitialized.value = false;
      isContextStarted.value = false;
      console.log('Audio resources disposed');

    } catch (err) {
      handleError(err as Error, 'Failed to dispose audio resources');
    }
  };

  /**
   * Get current audio context state
   */
  const getContextState = (): string => {
    if (!process.client || !Tone) {
      return 'unavailable';
    }
    return Tone.context.state;
  };

  // Cleanup on unmount
  onUnmounted(() => {
    dispose();
  });

  return {
    // State
    isInitialized: readonly(isInitialized),
    isContextStarted: readonly(isContextStarted),
    currentVolume: readonly(currentVolume),
    isInitializing: readonly(isInitializing),

    // Methods
    startAudioContext,
    initializeSynth,
    initializeAudioSystem,
    triggerNote,
    triggerAttack,
    triggerRelease,
    setVolume,
    setReverbWet,
    setDelayWet,
    updateSynthParams,
    dispose,
    getContextState,
    checkUserInteractionRequired
  };
}
