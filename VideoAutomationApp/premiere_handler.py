import os
import subprocess
import glob
import ctypes

class PremiereHandler:
    def __init__(self):
        self.premiere_exe = self.find_premiere_exe()

    def find_premiere_exe(self):
        # Common paths for Premiere Pro
        paths = [
            r"C:\Program Files\Adobe\Adobe Premiere Pro 2025\Adobe Premiere Pro.exe",
            r"C:\Program Files\Adobe\Adobe Premiere Pro 2024\Adobe Premiere Pro.exe",
            r"C:\Program Files\Adobe\Adobe Premiere Pro 2023\Adobe Premiere Pro.exe",
        ]
        # Also try wildcard search if exact match fails (slower but safer)
        if not any(os.path.exists(p) for p in paths):
             wildcard_paths = glob.glob(r"C:\Program Files\Adobe\Adobe Premiere Pro *\Adobe Premiere Pro.exe")
             if wildcard_paths:
                 return wildcard_paths[-1] # Use the latest version found
        
        for p in paths:
            if os.path.exists(p):
                return p
        return None

    def check_and_enable_scripting(self):
        """
        Checks if 'extendscriptprqe.txt' exists in Premiere directory.
        If not, tries to create it.
        Returns: (Success: bool, Message: str)
        """
        if not self.premiere_exe:
            return False, "Premiere Pro executable not found."
            
        premiere_dir = os.path.dirname(self.premiere_exe)
        marker_file = os.path.join(premiere_dir, "extendscriptprqe.txt")
        
        if os.path.exists(marker_file):
            return True, "Scripting already enabled."
            
        try:
            # 1. Create in Executable Directory
            with open(marker_file, "w") as f:
                f.write("")
            
            # 2. Create in Documents/Adobe/Premiere Pro/*/ (Cover all versions)
            docs_path = os.path.expanduser("~/Documents/Adobe/Premiere Pro")
            if os.path.exists(docs_path):
                for version_dir in os.listdir(docs_path):
                    full_ver_path = os.path.join(docs_path, version_dir)
                    if os.path.isdir(full_ver_path):
                        doc_marker = os.path.join(full_ver_path, "extendscriptprqe.txt")
                        try:
                            with open(doc_marker, "w") as f:
                                f.write("")
                        except:
                            pass # Ignore permission errors in docs, unlikely but possible
                            
            return True, "Enabled command line scripting (created extendscriptprqe.txt in EXE and Documents)."
        except PermissionError:
            return False, "Permission Denied: Cannot enable scripting.\n\nPlease run this app as ADMINISTRATOR once to fix this."
        except Exception as e:
            return False, f"Failed to enable scripting: {str(e)}"

    def launch_script(self, script_path):
        if not self.premiere_exe:
            return False, "Premiere Pro executable not found."
            
        try:
            norm_script_path = os.path.normpath(script_path)
            
            # Generate a manual batch file as a fallback (Keep this, it's useful)
            bat_path = os.path.join(os.path.dirname(script_path), "manual_launch.bat")
            with open(bat_path, "w") as f:
                f.write('@echo off\n')
                f.write(f'echo Launching Premiere Pro...\n')
                f.write(f'"{self.premiere_exe}" /C es.processFile "{norm_script_path}"\n')
                f.write('if %errorlevel% neq 0 pause\n')
            
            # BEST METHOD (Works for startup): Subprocess with list of arguments.
            # This worked for the "First Step" (Import).
            cmd = [self.premiere_exe, "/C", "es.processFile", norm_script_path]
            
            # Detach process
            subprocess.Popen(cmd, creationflags=0x00000008)
            
            return True, f"Launched via Subprocess. Manual fallback: {bat_path}"

        except Exception as e:
            return False, f"Failed to launch: {str(e)}"

    def generate_setup_script(self, project_path: str, rush_folder: str, script_output_path: str, project_file_path: str = None):
        """
        Generates an ExtendScript (.jsx) file that:
        1. Opens the project (if provided).
        2. Creates a 'RUSH' bin.
        3. Imports all video files from the rush_folder into that bin.
        """
        
        # Escape backslashes for JavaScript
        rush_folder_js = rush_folder.replace("\\", "\\\\")
        project_file_js = project_file_path.replace("\\", "\\\\") if project_file_path else ""
        
        # Get list of files to import
        files_to_import = []
        if os.path.exists(rush_folder):
            for f in os.listdir(rush_folder):
                if f.lower().endswith(('.mp4', '.mov', '.mxf', '.avi')):
                    full_path = os.path.join(rush_folder, f).replace("\\", "\\\\")
                    files_to_import.append(f"'{full_path}'")
        
        files_array_str = "[" + ",".join(files_to_import) + "]"

        script_content = f"""
        // Auto-generated script for Project: {os.path.basename(project_path)}
        
        var projectPath = "{project_file_js}";
        
        if (projectPath) {{
            app.openDocument(projectPath);
        }}
        
        var project = app.project;
        var rushBinName = "RUSH";
        
        function importFiles() {{
            if (!project) {{
                alert("No project open!");
                return;
            }}
            
            // 1. Create or Find RUSH Bin
            var rushBin = null;
            for (var i = 0; i < project.rootItem.children.numItems; i++) {{
                var item = project.rootItem.children[i];
                if (item.type == ProjectItemType.BIN && item.name == rushBinName) {{
                    rushBin = item;
                    break;
                }}
            }}
            
            if (!rushBin) {{
                rushBin = project.rootItem.createBin(rushBinName);
            }}
            
            // 2. Import Files
            var filePaths = {files_array_str};
            
            if (filePaths.length > 0) {{
                // importFiles(filePaths, suppressUI, targetBin, importAsNumberedStills)
                project.importFiles(filePaths, true, rushBin, false);
                
                // SELECT the files to make it easy for user to create proxies
                rushBin.select(); // Select the bin
                
                // SELECT the files to make it easy for user to create proxies
                rushBin.select(); // Select the bin
                
                // Silent operation: No alerts.
                // If Ingest Settings are on, this happens automatically.
            }} else {{
                // Only alert on error/empty
                // alert("No video files found to import.");
            }}
        }}
        
        importFiles();
        """
        
        with open(script_output_path, "w") as f:
            f.write(script_content)
            
        return script_output_path

    def generate_post_script(self, project_path: str, export_folder: str, final_export_folder: str, script_output_path: str, preset_path: str = "", final_preset_path: str = ""):
        """
        Generates a script for the post-editing phase:
        1. Export clips for subtitles.
        2. Apply effects (Ultra Key, Scale).
        3. Final Export.
        """
        # Escape paths - Ensure strictly double backslashes for Windows ExtendScript
import os
import subprocess
import glob
import ctypes

class PremiereHandler:
    def __init__(self):
        self.premiere_exe = self.find_premiere_exe()

    def find_premiere_exe(self):
        # Common paths for Premiere Pro
        paths = [
            r"C:\Program Files\Adobe\Adobe Premiere Pro 2025\Adobe Premiere Pro.exe",
            r"C:\Program Files\Adobe\Adobe Premiere Pro 2024\Adobe Premiere Pro.exe",
            r"C:\Program Files\Adobe\Adobe Premiere Pro 2023\Adobe Premiere Pro.exe",
        ]
        # Also try wildcard search if exact match fails (slower but safer)
        if not any(os.path.exists(p) for p in paths):
             wildcard_paths = glob.glob(r"C:\Program Files\Adobe\Adobe Premiere Pro *\Adobe Premiere Pro.exe")
             if wildcard_paths:
                 return wildcard_paths[-1] # Use the latest version found
        
        for p in paths:
            if os.path.exists(p):
                return p
        return None

    def check_and_enable_scripting(self):
        """
        Checks if 'extendscriptprqe.txt' exists in Premiere directory.
        If not, tries to create it.
        Returns: (Success: bool, Message: str)
        """
        if not self.premiere_exe:
            return False, "Premiere Pro executable not found."
            
        premiere_dir = os.path.dirname(self.premiere_exe)
        marker_file = os.path.join(premiere_dir, "extendscriptprqe.txt")
        
        if os.path.exists(marker_file):
            return True, "Scripting already enabled."
            
        try:
            # 1. Create in Executable Directory
            with open(marker_file, "w") as f:
                f.write("")
            
            # 2. Create in Documents/Adobe/Premiere Pro/*/ (Cover all versions)
            docs_path = os.path.expanduser("~/Documents/Adobe/Premiere Pro")
            if os.path.exists(docs_path):
                for version_dir in os.listdir(docs_path):
                    full_ver_path = os.path.join(docs_path, version_dir)
                    if os.path.isdir(full_ver_path):
                        doc_marker = os.path.join(full_ver_path, "extendscriptprqe.txt")
                        try:
                            with open(doc_marker, "w") as f:
                                f.write("")
                        except:
                            pass # Ignore permission errors in docs, unlikely but possible
                            
            return True, "Enabled command line scripting (created extendscriptprqe.txt in EXE and Documents)."
        except PermissionError:
            return False, "Permission Denied: Cannot enable scripting.\n\nPlease run this app as ADMINISTRATOR once to fix this."
        except Exception as e:
            return False, f"Failed to enable scripting: {str(e)}"

    def launch_script(self, script_path):
        if not self.premiere_exe:
            return False, "Premiere Pro executable not found."
            
        try:
            norm_script_path = os.path.normpath(script_path)
            
            # Generate a manual batch file as a fallback (Keep this, it's useful)
            bat_path = os.path.join(os.path.dirname(script_path), "manual_launch.bat")
            with open(bat_path, "w") as f:
                f.write('@echo off\n')
                f.write(f'echo Launching Premiere Pro...\n')
                f.write(f'"{self.premiere_exe}" /C es.processFile "{norm_script_path}"\n')
                f.write('if %errorlevel% neq 0 pause\n')
            
            # BEST METHOD (Works for startup): Subprocess with list of arguments.
            # This worked for the "First Step" (Import).
            cmd = [self.premiere_exe, "/C", "es.processFile", norm_script_path]
            
            # Detach process
            subprocess.Popen(cmd, creationflags=0x00000008)
            
            return True, f"Launched via Subprocess. Manual fallback: {bat_path}"

        except Exception as e:
            return False, f"Failed to launch: {str(e)}"

    def generate_setup_script(self, project_path: str, rush_folder: str, script_output_path: str, project_file_path: str = None):
        """
        Generates an ExtendScript (.jsx) file that:
        1. Opens the project (if provided).
        2. Creates a 'RUSH' bin.
        3. Imports all video files from the rush_folder into that bin.
        """
        
        # Escape backslashes for JavaScript
        rush_folder_js = rush_folder.replace("\\", "\\\\")
        project_file_js = project_file_path.replace("\\", "\\\\") if project_file_path else ""
        
        # Get list of files to import
        files_to_import = []
        if os.path.exists(rush_folder):
            for f in os.listdir(rush_folder):
                if f.lower().endswith(('.mp4', '.mov', '.mxf', '.avi')):
                    full_path = os.path.join(rush_folder, f).replace("\\", "\\\\")
                    files_to_import.append(f"'{full_path}'")
        
        files_array_str = "[" + ",".join(files_to_import) + "]"

        script_content = f"""
        // Auto-generated script for Project: {os.path.basename(project_path)}
        
        var projectPath = "{project_file_js}";
        
        if (projectPath) {{
            app.openDocument(projectPath);
        }}
        
        var project = app.project;
        var rushBinName = "RUSH";
        
        function importFiles() {{
            if (!project) {{
                alert("No project open!");
                return;
            }}
            
            // 1. Create or Find RUSH Bin
            var rushBin = null;
            for (var i = 0; i < project.rootItem.children.numItems; i++) {{
                var item = project.rootItem.children[i];
                if (item.type == ProjectItemType.BIN && item.name == rushBinName) {{
                    rushBin = item;
                    break;
                }}
            }}
            
            if (!rushBin) {{
                rushBin = project.rootItem.createBin(rushBinName);
            }}
            
            // 2. Import Files
            var filePaths = {files_array_str};
            
            if (filePaths.length > 0) {{
                // importFiles(filePaths, suppressUI, targetBin, importAsNumberedStills)
                project.importFiles(filePaths, true, rushBin, false);
                
                // SELECT the files to make it easy for user to create proxies
                rushBin.select(); // Select the bin
                
                // SELECT the files to make it easy for user to create proxies
                rushBin.select(); // Select the bin
                
                // Silent operation: No alerts.
                // If Ingest Settings are on, this happens automatically.
            }} else {{
                // Only alert on error/empty
                // alert("No video files found to import.");
            }}
        }}
        
        importFiles();
        """
        
        with open(script_output_path, "w") as f:
            f.write(script_content)
            
        return script_output_path

    def generate_post_script(self, project_path: str, export_folder: str, final_export_folder: str, script_output_path: str, preset_path: str = "", final_preset_path: str = ""):
        """
        Generates a script for the post-editing phase:
        1. Export clips for subtitles.
        2. Apply effects (Ultra Key, Scale).
        3. Final Export.
        """
        # Escape paths - Ensure strictly double backslashes for Windows ExtendScript
        # We first normalize to backslashes, then escape them.
        preset_path_js = preset_path.replace("/", "\\").replace("\\", "\\\\") if preset_path else ""
        final_preset_path_js = final_preset_path.replace("/", "\\").replace("\\", "\\\\") if final_preset_path else ""
        
        script_content = f"""
        // Auto-generated Post-Processing Script
        // Generated by VideoAutomationTool v60
        
        try {{
            main();
        }} catch (e) {{
            alert("CRITICAL MAIN ERROR: " + e.toString());
        }}

        function main() {{
            var project = app.project;
            
            if (!project) {{
                alert("No project open!");
                return;
            }}
            
            // DYNAMIC PATHS: Use the active project's path to determine export folders
            var projectPath = project.path;
            var exportDirPreSub = "";
            var exportDirFinal = "";
            
            if (projectPath) {{
                var projectFile = new File(projectPath);
                var projectParentDir = projectFile.parent;
                
                // Create 'pre-sub' folder
                var preSubFolder = new Folder(projectParentDir.fsName + "\\\\pre-sub");
                if (!preSubFolder.exists) preSubFolder.create();
                exportDirPreSub = preSubFolder.fsName.replace(/\\\\/g, "\\\\\\\\"); // Escape for JS string
                
                // Create 'final_export' folder
                var finalFolder = new Folder(projectParentDir.fsName + "\\\\final_export");
                if (!finalFolder.exists) finalFolder.create();
                exportDirFinal = finalFolder.fsName.replace(/\\\\/g, "\\\\\\\\");
            }} else {{
                alert("Project has not been saved yet! Please save the project first so we know where to export.");
                return;
            }}

            var sequence = project.activeSequence;
            
            // Fallback: If no active sequence, try to find the first sequence in the project
            if (!sequence) {{
                var sequences = project.sequences;
                if (sequences.numSequences > 0) {{
                    sequence = sequences[0];
                    project.openSequence(sequence.sequenceID); // Activate it
                }}
            }}
            
            if (!sequence) {{
                alert("No sequence found in the project! Please create a sequence first.");
            }} else {{
                var outputPresetPath = "{preset_path_js}"; 
                var finalPresetPath = "{final_preset_path_js}";
                // NOTE: You need to provide a valid .epr file path for export to work via script usually, 
                // or rely on the default encoder launch.
                
                // Helper: Apply Effects
                function applyEffectsToClips() {{
                    var track = sequence.videoTracks[0]; // Assuming V1
                    for (var i = 0; i < track.clips.numItems; i++) {{
                        var clip = track.clips[i];
                        
                        // 1. Scale to 200%
                        // Accessing Motion effect is tricky, usually requires finding the component
                        for (var j = 0; j < clip.components.numItems; j++) {{
                            var component = clip.components[j];
                            if (component.displayName == "Motion") {{
                                var scaleParam = component.properties.getParamForDisplayName("Scale");
                                if (scaleParam) {{
                                    scaleParam.setValue(200, true);
                                }}
                                break;
                            }}
                        }}
                        
                        // 2. Add Ultra Key (This requires the effect to be applied first)
                        // Scripting cannot easily "apply" an effect from the effects panel unless using QE DOM (unsupported)
                        // or if the effect is already there.
                        // Workaround: Alert user to apply a preset.
                    }}
                    alert("Applied Scale 200% to all clips on V1.\\n\\nFor Ultra Key: Please select all clips and drag your Ultra Key preset onto them.");
                }}
                
                // Helper: Find Item Recursively
                function findItemRecursive(container, name) {{
                    for (var i = 0; i < container.children.numItems; i++) {{
                        var item = container.children[i];
                        if (item.name.toLowerCase().indexOf(name.toLowerCase()) >= 0) {{
                            return item;
                        }}
                        if (item.type == ProjectItemType.BIN) {{
                            var found = findItemRecursive(item, name);
                            if (found) return found;
                        }}
                    }}
                    return null;
                }}

                // Helper: Calculate Bitrate and Modify Preset
                function calculateBitrateAndModifyPreset(presetPath, sequenceDurationSec) {{
                    try {{
                        if (!presetPath) return presetPath;
                        var f = new File(presetPath);
                        if (!f.exists) return presetPath;
                        
                        // Target Size: 47 MB (approx 45-49 MB range)
                        // Bitrate (Mbps) = (Target Size (MB) * 8) / Duration (sec)
                        
                        if (sequenceDurationSec <= 0) return presetPath;
                        
                        var targetSizeMB = 47.0;
                        var targetBitrateMbps = (targetSizeMB * 8) / sequenceDurationSec;
                        
                        // Clamp Bitrate (e.g., between 0.5 Mbps and 50 Mbps) to avoid crazy values
                        if (targetBitrateMbps < 0.5) targetBitrateMbps = 0.5;
                        if (targetBitrateMbps > 50.0) targetBitrateMbps = 50.0;
                        
                        // Round to 4 decimal places
                        targetBitrateMbps = Math.round(targetBitrateMbps * 10000) / 10000;
                        
                        // Read Preset File
                        f.open("r");
                        var content = f.read();
                        f.close();
                        
                        // Regex to find and replace Target Bitrate
                        var targetRegex = /<ExporterParam\\s+ObjectID="(\\d+)"[^>]*>([\\s\\S]*?)<ParamIdentifier>ADBEVideoTargetBitrate<\\/ParamIdentifier>([\\s\\S]*?)<\\/ExporterParam>/g;
                        content = content.replace(targetRegex, function(match, id, before, after) {{
                            return match.replace(/<ParamValue>[0-9\\.]+<\\/ParamValue>/, "<ParamValue>" + targetBitrateMbps + "<\\/ParamValue>");
                        }});
                        
                        // Replace Max Bitrate (Target * 1.2)
                        var maxBitrateMbps = targetBitrateMbps * 1.2;
                        maxBitrateMbps = Math.round(maxBitrateMbps * 10000) / 10000;
                        
                        var maxRegex = /<ExporterParam\\s+ObjectID="(\\d+)"[^>]*>([\\s\\S]*?)<ParamIdentifier>ADBEVideoMaxBitrate<\\/ParamIdentifier>([\\s\\S]*?)<\\/ExporterParam>/g;
                        content = content.replace(maxRegex, function(match, id, before, after) {{
                            return match.replace(/<ParamValue>[0-9\\.]+<\\/ParamValue>/, "<ParamValue>" + maxBitrateMbps + "<\\/ParamValue>");
                        }});
                        
                        // Write to Temp Preset
                        var tempFolder = Folder.temp;
                        var tempPresetPath = tempFolder.fsName + "\\\\dynamic_bitrate_" + Math.floor(Math.random()*1000) + ".epr";
                        var tempFile = new File(tempPresetPath);
                        tempFile.open("w");
                        tempFile.write(content);
                        tempFile.close();
                        
                        return tempPresetPath;
                    }} catch(e) {{
                        alert("Error in Dynamic Bitrate Calculation: " + e.toString());
                        return presetPath; // Fallback to original
                    }}
                }}

                // Helper: Add Black Video
                function addBlackVideo() {{
                    var blackItem = null;
                    // Find "Black Video" or "Noir" recursively
                    blackItem = findItemRecursive(project.rootItem, "Black Video");
                    if (!blackItem) {{
                        blackItem = findItemRecursive(project.rootItem, "Noir");
                    }}
                    
                    if (!blackItem) {{
                        alert("WARNING: Could not find an item named 'Black Video' or 'Noir' in the project bin.\\nSkipping Black Video overlay.");
                        return;
                    }}
                    
                    // Add to a new track (or highest existing)
                    var numTracks = sequence.videoTracks.numTracks;
                    var targetTrack = sequence.videoTracks[numTracks - 1]; // Use last track
                    
                    // Ideally we'd create a new track but scripting that is complex.
                    // We'll overlay on the highest track.
                    
                    // We need to cover the whole sequence.
                    // Assuming Black Video is a still/synthetic, we can insert it.
                    // But setting duration is tricky if it's not already set.
                    
                    // Simple approach: Overwrite at start.
                    // Note: This might not cover the whole duration if the item default duration is short.
                    // User might need to extend it manually.
                    
                    targetTrack.overwriteClip(blackItem, 0);
                    
                    // alert("Added Black Video to Track V" + numTracks + ".\\nPlease ensure it covers the entire sequence duration if needed.");
                }}
                
                // Helper: Export Clips (Grouped by contiguous blocks)
                function exportClips(outputDir, prefix, presetFile) {{
                    var track = sequence.videoTracks[0];
                    var originalOut = sequence.getOutPoint();
                    var originalIn = sequence.getInPoint();
                    
                    if (track.clips.numItems == 0) {{
                        alert("No clips found on V1!");
                        return;
                    }}

                    var exportGroups = [];
                    var currentGroup = {{
                        start: track.clips[0].start.seconds,
                        end: track.clips[0].end.seconds,
                        clips: 1
                    }};

                    // Loop through remaining clips to group them
                    for (var i = 1; i < track.clips.numItems; i++) {{
                        var clip = track.clips[i];
                        var gap = clip.start.seconds - currentGroup.end;
                        
                        // If gap is less than 1 second, treat as same video
                        if (gap < 1.0) {{
                            currentGroup.end = clip.end.seconds;
                            currentGroup.clips++;
                        }} else {{
                            // Gap found, push current group and start new one
                            exportGroups.push(currentGroup);
                            currentGroup = {{
                                start: clip.start.seconds,
                                end: clip.end.seconds,
                                clips: 1
                            }};
                        }}
                    }}
                    // Push the last group
                    exportGroups.push(currentGroup);

                    // Process Exports
                    if (exportGroups.length > 0) {{
                        app.encoder.launchEncoder(); // Ensure AME is open
                        project.save(); // Save project to ensure AME sees the latest state
                    }}

                    for (var i = 0; i < exportGroups.length; i++) {{
                        var group = exportGroups[i];
                        
                        // Set Sequence In/Out
                        sequence.setInPoint(group.start);
                        sequence.setOutPoint(group.end);
                        
                        // Get Project Name without extension
                        var projName = "";
                        if (project.name) {{
                            projName = project.name.replace(".prproj", "").replace(".PRPROJ", "");
                        }}
                        if (!projName || projName == "") {{
                            projName = "Untitled";
                            // Try to get from path if name is missing
                            if (project.path) {{
                                 var f = new File(project.path);
                                 projName = f.name.replace(".prproj", "").replace(".PRPROJ", "");
                            }}
                        }}

                        // Format: ProjectName_presub_01.mp4
                        // Pad number with leading zero if less than 10
                        var numStr = (i+1) < 10 ? "0" + (i+1) : (i+1);
                        
                        // Force the prefix to be clean
                        var cleanPrefix = prefix.replace("_", "");
                        
                        var outName = projName + "_" + cleanPrefix + "_" + numStr;
                        var fullPath = outputDir + "\\\\" + outName + ".mp4";
                        
                        if (presetFile && new File(presetFile).exists) {{
                            // Use '1' for Work Area (ENCODE_WORKAREA might be undefined)
                            var jobID = app.encoder.encodeSequence(sequence, fullPath, presetFile, 1, 1);
                        }} else {{
                            alert("CRITICAL ERROR: Export Preset not found!\\nPath: " + presetFile + "\\n\\nPlease check the path in the App.");
                            return; // Stop if preset is missing
                        }}
                    }}
                    
                    alert("Queued " + exportGroups.length + " videos (from " + track.clips.numItems + " clips) to Media Encoder.");
                }}

                var choice = prompt("Choose Action:\\n1. Export for Subtitles (Pre-Sub)\\n2. Apply Effects (Scale 200%)\\n3. Final Export", "1");
                
                if (choice == "1") {{
                    // Export logic
                    alert("To export for subtitles:\\n1. Ensure Media Encoder is open.\\n2. This script will try to add a Black Video on top.\\n3. Then it will queue exports.");
                    
                    // Try to add Black Video
                    addBlackVideo();
                    
                    exportClips(exportDirPreSub, "presub", outputPresetPath);
                }} else if (choice == "2") {{
                    applyEffectsToClips();
                }} else if (choice == "3") {{
                    alert("TRACE 3.1: Starting Final Export Logic...");
                    
                    if (!finalPresetPath || !new File(finalPresetPath).exists) {{
                        alert("ERROR: Final Export Preset not found!\\nPlease select a valid .epr file in the app.");
                        return;
                    }}

                    alert("TRACE 3.2: Preset Found: " + finalPresetPath);

                    // Calculate Dynamic Bitrate based on Sequence Duration
                    var durationSec = 0;
                    if (sequence.end && sequence.end.seconds) {{
                        durationSec = sequence.end.seconds - sequence.start.seconds;
                    }} else {{
                        durationSec = (parseFloat(sequence.end) - parseFloat(sequence.start)) / 254016000000.0;
                    }}
                    
                    alert("TRACE 3.3: Sequence Duration: " + durationSec + " seconds");
                    
                    // Use the helper to create a temp preset with correct bitrate
                    alert("TRACE 3.4: Calling calculateBitrateAndModifyPreset...");
                    var dynamicPresetPath = calculateBitrateAndModifyPreset(finalPresetPath, durationSec);
                    
                    alert("TRACE 3.5: Dynamic Preset Created at: " + dynamicPresetPath);
                    
                    if (!dynamicPresetPath || !new File(dynamicPresetPath).exists) {{
                        alert("WARNING: Dynamic preset creation failed. Using original preset.");
                        dynamicPresetPath = finalPresetPath;
                    }}
                    
                    alert("TRACE 3.6: Calling exportClips...");
                    exportClips(exportDirFinal, "final", dynamicPresetPath);
                    
                    alert("TRACE 3.7: Final Export Batch Queued Successfully.");
                }}
            }}
        }}
        """
        
        with open(script_output_path, "w") as f:
            f.write(script_content)
            
        return script_output_path
        

