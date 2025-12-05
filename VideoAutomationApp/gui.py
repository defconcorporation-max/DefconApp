import customtkinter as ctk
from tkinter import filedialog, messagebox
import os
import threading
from file_manager import FileManager
from premiere_handler import PremiereHandler

import json

class VideoAutomationApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Video Automation Tool v60")
        self.geometry("900x750")
        
        self.config_file = "config.json"
        self.config = self.load_config()
        
        self.file_manager = FileManager()
        self.premiere_handler = PremiereHandler()
        
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self.setup_ui()
        self.load_ui_values()
        
        # Check scripting status on startup (optional, or do it during import)
        # self.check_scripting_status()

    def check_scripting_status(self):
        success, msg = self.premiere_handler.check_and_enable_scripting()
        if not success:
            messagebox.showwarning("Setup Required", msg)

    def load_config(self):
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, "r") as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def save_config(self):
        with open(self.config_file, "w") as f:
            json.dump(self.config, f)

    def setup_ui(self):
        # Main Container
        self.main_frame = ctk.CTkFrame(self)
        self.main_frame.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        self.main_frame.grid_columnconfigure(1, weight=1)

        # --- Section 1: Project Creation ---
        self.label_title = ctk.CTkLabel(self.main_frame, text="Create New Project", font=("Roboto", 24, "bold"))
        self.label_title.grid(row=0, column=0, columnspan=3, pady=(10, 20), sticky="w")

        # Project Name
        self.label_name = ctk.CTkLabel(self.main_frame, text="Project Name:")
        self.label_name.grid(row=1, column=0, padx=10, pady=10, sticky="w")
        
        self.entry_name = ctk.CTkEntry(self.main_frame, placeholder_text="e.g. docSablage_november2025")
        self.entry_name.grid(row=1, column=1, padx=10, pady=10, sticky="ew")

        # Parent Folder Selection
        self.label_folder = ctk.CTkLabel(self.main_frame, text="Save Location:")
        self.label_folder.grid(row=2, column=0, padx=10, pady=10, sticky="w")
        
        self.entry_folder = ctk.CTkEntry(self.main_frame, placeholder_text="Select folder...")
        self.entry_folder.grid(row=2, column=1, padx=10, pady=10, sticky="ew")
        
        self.btn_browse_folder = ctk.CTkButton(self.main_frame, text="Browse", command=self.browse_folder, width=100)
        self.btn_browse_folder.grid(row=2, column=2, padx=10, pady=10)

        # SD Card Selection
        self.label_sd = ctk.CTkLabel(self.main_frame, text="SD Card / Source:")
        self.label_sd.grid(row=3, column=0, padx=10, pady=10, sticky="w")
        
        self.entry_sd = ctk.CTkEntry(self.main_frame, placeholder_text="Select source folder...")
        self.entry_sd.grid(row=3, column=1, padx=10, pady=10, sticky="ew")
        
        self.btn_browse_sd = ctk.CTkButton(self.main_frame, text="Browse", command=self.browse_sd, width=100)
        self.btn_browse_sd.grid(row=3, column=2, padx=10, pady=10)

        # Template Selection (Optional but recommended)
        self.label_template = ctk.CTkLabel(self.main_frame, text="Premiere Template (.prproj):")
        self.label_template.grid(row=4, column=0, padx=10, pady=10, sticky="w")
        
        self.entry_template = ctk.CTkEntry(self.main_frame, placeholder_text="Optional: Select .prproj template")
        self.entry_template.grid(row=4, column=1, padx=10, pady=10, sticky="ew")
        
        self.btn_browse_template = ctk.CTkButton(self.main_frame, text="Browse", command=self.browse_template, width=100)
        self.btn_browse_template.grid(row=4, column=2, padx=10, pady=10)

        # Action Button
        self.btn_create = ctk.CTkButton(self.main_frame, text="Create Project & Import", command=self.start_import_process, height=40, fg_color="green")
        self.btn_create.grid(row=5, column=0, columnspan=3, padx=10, pady=20, sticky="ew")

        # Status / Log
        self.textbox_log = ctk.CTkTextbox(self.main_frame, height=150)
        self.textbox_log.grid(row=6, column=0, columnspan=3, padx=10, pady=10, sticky="nsew")
        

        
        # --- Section 2: Post-Processing ---
        self.label_post = ctk.CTkLabel(self.main_frame, text="Post-Processing Automation", font=("Roboto", 20, "bold"))
        self.label_post.grid(row=7, column=0, columnspan=3, pady=(20, 10), sticky="w")
        
        # Export Preset Selection (Pre-Sub)
        self.label_preset = ctk.CTkLabel(self.main_frame, text="Pre-Sub Preset (.epr):")
        self.label_preset.grid(row=8, column=0, padx=10, pady=10, sticky="w")
        
        self.entry_preset = ctk.CTkEntry(self.main_frame, placeholder_text="Select .epr for Subtitles")
        self.entry_preset.grid(row=8, column=1, padx=10, pady=10, sticky="ew")
        
        self.btn_browse_preset = ctk.CTkButton(self.main_frame, text="Browse", command=self.browse_preset, width=100)
        self.btn_browse_preset.grid(row=8, column=2, padx=10, pady=10)

        # Export Preset Selection (Final)
        self.label_final_preset = ctk.CTkLabel(self.main_frame, text="Final Export Preset (.epr):")
        self.label_final_preset.grid(row=9, column=0, padx=10, pady=10, sticky="w")
        
        self.entry_final_preset = ctk.CTkEntry(self.main_frame, placeholder_text="Select .epr for Final Export")
        self.entry_final_preset.grid(row=9, column=1, padx=10, pady=10, sticky="ew")
        
        self.btn_browse_final_preset = ctk.CTkButton(self.main_frame, text="Browse", command=self.browse_final_preset, width=100)
        self.btn_browse_final_preset.grid(row=9, column=2, padx=10, pady=10)
        
        # Generate Button
        self.btn_post_process = ctk.CTkButton(self.main_frame, text="Generate Post-Processing Script", command=self.generate_post_script)
        self.btn_post_process.grid(row=10, column=0, columnspan=2, padx=10, pady=10, sticky="ew")
        
        # Copy Path Button (Small, next to Generate)
        self.btn_copy_path = ctk.CTkButton(self.main_frame, text="Copy Path", command=self.copy_script_path, width=80)
        self.btn_copy_path.grid(row=10, column=2, padx=10, pady=10)
        
        # Show Command Button (For debugging)
        self.btn_show_cmd = ctk.CTkButton(self.main_frame, text="Show CMD", command=self.show_command, width=80, fg_color="gray")
        self.btn_show_cmd.grid(row=11, column=2, padx=10, pady=10)

        # Troubleshoot Button
        self.btn_troubleshoot = ctk.CTkButton(self.main_frame, text="Troubleshoot Scripting (Admin)", command=self.troubleshoot_scripting, fg_color="gray")
        self.btn_troubleshoot.grid(row=11, column=0, columnspan=3, padx=10, pady=10, sticky="ew")

    def troubleshoot_scripting(self):
        success, msg = self.premiere_handler.check_and_enable_scripting()
        if success:
            messagebox.showinfo("Scripting Status", f"Success!\n{msg}\n\nOpening folder so you can verify 'extendscriptprqe.txt' exists...")
            if self.premiere_handler.premiere_exe:
                os.startfile(os.path.dirname(self.premiere_handler.premiere_exe))
        else:
            messagebox.showerror("Scripting Error", f"Failed to enable scripting.\n{msg}")

    def load_ui_values(self):
        if "last_folder" in self.config:
            self.entry_folder.insert(0, self.config["last_folder"])
        if "last_template" in self.config:
            self.entry_template.insert(0, self.config["last_template"])
        if "last_preset" in self.config:
            self.entry_preset.insert(0, self.config["last_preset"])
        if "last_final_preset" in self.config:
            self.entry_final_preset.insert(0, self.config["last_final_preset"])

    def browse_preset(self):
        filename = filedialog.askopenfilename(title="Select Export Preset", filetypes=[("Export Presets", "*.epr")])
        if filename:
            self.entry_preset.delete(0, "end")
            self.entry_preset.insert(0, filename)

    def browse_final_preset(self):
        filename = filedialog.askopenfilename(title="Select Final Export Preset", filetypes=[("Export Presets", "*.epr")])
        if filename:
            self.entry_final_preset.delete(0, "end")
            self.entry_final_preset.insert(0, filename)

    def generate_post_script(self):
        # DEBUG: Immediate feedback
        # messagebox.showinfo("Debug", "Button Clicked! Starting process...") 
        
        try:
            self.log("--- Starting Post-Processing Generation ---")
            
            # Check if Premiere Executable is known
            if self.premiere_handler.premiere_exe:
                self.log(f"Target Premiere: {self.premiere_handler.premiere_exe}")
            else:
                self.log("WARNING: Premiere Pro executable NOT found. Auto-launch will fail.")

            project_name = self.entry_name.get().strip()
            parent_folder = self.entry_folder.get().strip()
            preset_path = self.entry_preset.get().strip()
            final_preset_path = self.entry_final_preset.get().strip()
            
            # Save preset to config if provided
            if preset_path:
                self.config["last_preset"] = preset_path
            if final_preset_path:
                self.config["last_final_preset"] = final_preset_path
            self.save_config()
            
            # Relaxed Requirements: If Name/Folder are missing, use a temp location for the script
            # and rely on the dynamic logic inside the script to find the project path.
            
            if not project_name or not parent_folder:
                # Use a temporary location for the script
                # CLEANUP: Remove old temp scripts
                try:
                    import glob
                    for f in glob.glob("PostScript_v*.jsx"):
                        os.remove(f)
                except:
                    pass

                import random
                rand_id = random.randint(1000, 9999)


                desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
                script_filename = f"VideoAutomation_Script_v60_{rand_id}.jsx"
                script_path = os.path.join(desktop_path, script_filename)
                
                # We pass dummy paths for the folders, as the script will ignore them and calculate its own
                self.premiere_handler.generate_post_script("", "", "", script_path, preset_path, final_preset_path)
                
                # VERIFY CONTENT
                with open(script_path, "r") as f:
                    first_line = f.readline().strip()
                
                self.log(f"Generated: {script_filename}")
                
                # Open the folder for the user
                try:
                    os.startfile(os.path.dirname(script_path))
                except:
                    pass
                    
                messagebox.showinfo("Script Generated", f"Script saved to:\n{script_filename}\n\nPlease run this file in Premiere.")
            else:
                project_path = os.path.join(parent_folder, project_name)
                # Ensure project folder exists if we are being specific
                if not os.path.exists(project_path):
                     # Fallback to temp if specific folder not found
                     script_path = os.path.abspath("temp_post_processing.jsx")
                     self.premiere_handler.generate_post_script("", "", "", script_path, preset_path, final_preset_path)
                     self.log(f"Project folder not found, using Dynamic Mode: {script_path}")
                else:
                    # Create export folders (still good to do from Python if we can)
                    pre_sub_path = os.path.join(project_path, "pre-sub")
                    final_path = os.path.join(project_path, "final_export")
                    os.makedirs(pre_sub_path, exist_ok=True)
                    os.makedirs(final_path, exist_ok=True)
                    
                    script_path = os.path.join(project_path, "post_processing.jsx")
                    self.premiere_handler.generate_post_script(project_path, pre_sub_path, final_path, script_path, preset_path, final_preset_path)
                    self.log(f"Script generated: {script_path}")
            
            # Auto-Launch for Post-Processing
            self.log("Attempting to launch/focus Premiere with script...")
            
            # COPY PATH AUTOMATICALLY
            self.clipboard_clear()
            self.clipboard_append(script_path)
            self.log("Script path copied to clipboard!")
            
            success, msg = self.premiere_handler.launch_script(script_path)
            
            if success:
                self.log("Command sent to Premiere Pro.")
                messagebox.showinfo("Script Generated", 
                    f"Script generated at:\n{script_path}\n\n"
                    f"NOTE: If Premiere is ALREADY OPEN, the auto-launch might fail with a '/C' error.\n\n"
                    f"If that happens:\n"
                    f"1. Go to Premiere Pro\n"
                    f"2. File > Scripts > Run Script File...\n"
                    f"3. Paste the path (it's already in your clipboard!)\n"
                    f"4. Press Enter")
            else:
                self.log(f"Auto-launch failed: {msg}")
                messagebox.showwarning("Launch Failed", f"Could not launch script automatically.\n{msg}")

        except Exception as e:
            self.log(f"CRITICAL ERROR: {str(e)}")
            messagebox.showerror("Error", f"An error occurred:\n{str(e)}")

    def copy_script_path(self):
        # Helper to copy the expected script path to clipboard
        project_name = self.entry_name.get().strip()
        parent_folder = self.entry_folder.get().strip()
        if project_name and parent_folder:
            path = os.path.join(parent_folder, project_name, "post_processing.jsx")
            self.clipboard_clear()
            self.clipboard_append(path)
            messagebox.showinfo("Copied", "Script path copied to clipboard!")
        else:
            messagebox.showwarning("Info", "Enter Project Name and Folder first.")

    def show_command(self):
        # Show the exact command we are trying to run
        if self.premiere_handler.premiere_exe:
            project_name = self.entry_name.get().strip()
            parent_folder = self.entry_folder.get().strip()
            if project_name and parent_folder:
                script_path = os.path.join(parent_folder, project_name, "post_processing.jsx")
                # Correct command format for manual testing
                cmd = f'"{self.premiere_handler.premiere_exe}" /C es.processFile "{script_path}"'
                
                # Copy to clipboard
                self.clipboard_clear()
                self.clipboard_append(cmd)
                
                messagebox.showinfo("Command Copied", f"Here is the command:\n\n{cmd}\n\nIt has been copied to your clipboard.\nTry pasting this into a Command Prompt (cmd.exe) to test.")
            else:
                messagebox.showwarning("Info", "Enter Project Name and Folder first.")
        else:
            messagebox.showerror("Error", "Premiere Executable not found.")
    def browse_folder(self):
        folder = filedialog.askdirectory()
        if folder:
            self.entry_folder.delete(0, "end")
            self.entry_folder.insert(0, folder)

    def browse_sd(self):
        folder = filedialog.askdirectory()
        if folder:
            self.entry_sd.delete(0, "end")
            self.entry_sd.insert(0, folder)

    def browse_template(self):
        file = filedialog.askopenfilename(filetypes=[("Premiere Project", "*.prproj")])
        if file:
            self.entry_template.delete(0, "end")
            self.entry_template.insert(0, file)

    def log(self, message):
        print(f"[LOG] {message}")
        self.textbox_log.insert("end", message + "\n")
        self.textbox_log.see("end")

    def start_import_process(self):
        name = self.entry_name.get().strip()
        parent = self.entry_folder.get().strip()
        source = self.entry_sd.get().strip()
        template = self.entry_template.get().strip()

        if not name or not parent or not source:
            messagebox.showerror("Error", "Please fill in all required fields (Name, Location, Source).")
            return

        if not os.path.exists(parent):
             messagebox.showerror("Error", f"Save Location does not exist:\n{parent}")
             return

        if not template:
            if not messagebox.askyesno("Warning", "No Premiere Template selected.\n\nA .prproj file will NOT be created.\nThe app will only create folders and import files.\n\nDo you want to continue?"):
                return
        elif not os.path.exists(template):
            messagebox.showerror("Error", f"Template file not found:\n{template}")
            return

        # Save config
        self.config["last_folder"] = parent
        self.config["last_template"] = template
        self.save_config()

        self.btn_create.configure(state="disabled")
        self.log(f"Starting project creation: {name}")
        
        # Run in separate thread to keep UI responsive
        threading.Thread(target=self.run_import_thread, args=(name, parent, source, template), daemon=True).start()

    def run_import_thread(self, name, parent, source, template):
        try:
            # 1. Create Folders
            self.log("Creating folder structure...")
            project_path, rush_path = self.file_manager.create_project_structure(parent, name)
            self.log(f"Created: {project_path}")
            self.log(f"Created: {rush_path}")

            # 2. Copy Template (if provided)
            if template and os.path.exists(template):
                import shutil
                dest_template = os.path.join(project_path, f"{name}.prproj")
                shutil.copy2(template, dest_template)
                self.log(f"Copied template to: {dest_template}")
            else:
                self.log("No template selected, skipping .prproj creation.")

            # 3. Import Files
            self.log("Starting file import from SD card...")
            self.file_manager.import_files_from_sd(
                source, 
                rush_path, 
                progress_callback=lambda msg: self.after(0, self.log, msg),
                error_callback=lambda msg: self.after(0, self.log, f"ERROR: {msg}")
            )
            
            # 4. Generate Premiere Script
            self.log("Generating Premiere Pro import script...")
            script_path = os.path.join(project_path, "import_files.jsx")
            
            # Determine the .prproj path
            project_file_path = None
            if template:
                 project_file_path = dest_template
            
            self.premiere_handler.generate_setup_script(project_path, rush_path, script_path, project_file_path)
            self.log(f"Script generated: {script_path}")
            
            # 5. Auto-Launch
            self.log("Checking Premiere scripting status...")
            script_enabled, script_msg = self.premiere_handler.check_and_enable_scripting()
            
            if not script_enabled:
                self.log(f"WARNING: {script_msg}")
                messagebox.showwarning("Admin Required", script_msg)
            else:
                self.log("Attempting to launch Premiere Pro...")
                success, msg = self.premiere_handler.launch_script(script_path)
                if success:
                    self.log("Premiere Pro launched! Check the app.")
                else:
                    self.log(f"Auto-launch failed: {msg}")
                    self.log("Please manually run the script: File > Scripts > Run Script File")
            
            self.after(0, self.log, "Import Process Complete!")
            self.after(0, lambda: messagebox.showinfo("Success", "Project created! Premiere should open shortly."))

        except Exception as e:
            self.after(0, self.log, f"CRITICAL ERROR: {str(e)}")
            self.after(0, lambda: messagebox.showerror("Error", str(e)))
        finally:
            self.after(0, lambda: self.btn_create.configure(state="normal"))

if __name__ == "__main__":
    app = VideoAutomationApp()
    app.mainloop()
