import os
import shutil
import time
import threading
from typing import Callable, Optional

class FileManager:
    def __init__(self):
        self.stop_flag = False

    def create_project_structure(self, parent_folder: str, project_name: str) -> str:
        """Creates the project folder and RUSH subfolder. Returns the path to RUSH folder."""
        project_path = os.path.join(parent_folder, project_name)
        rush_path = os.path.join(project_path, "RUSH")
        
        if not os.path.exists(project_path):
            os.makedirs(project_path)
        if not os.path.exists(rush_path):
            os.makedirs(rush_path)
            
        return project_path, rush_path

    def import_files_from_sd(self, source_folder: str, dest_folder: str, 
                           progress_callback: Optional[Callable[[str], None]] = None,
                           error_callback: Optional[Callable[[str], None]] = None):
        """
        Imports files from source to dest.
        Retries if source becomes unavailable (simulating SD card disconnect).
        """
        self.stop_flag = False
        
        if not os.path.exists(source_folder):
            if error_callback:
                error_callback(f"Source folder not found: {source_folder}")
            return

        files = [f for f in os.listdir(source_folder) if os.path.isfile(os.path.join(source_folder, f))]
        total_files = len(files)
        
        for i, filename in enumerate(files):
            if self.stop_flag:
                break
                
            source_file = os.path.join(source_folder, filename)
            dest_file = os.path.join(dest_folder, filename)
            
            # Retry logic for SD card disconnection
            while not os.path.exists(source_file):
                if self.stop_flag:
                    break
                if progress_callback:
                    progress_callback(f"Waiting for SD card... Reconnecting in 5s...")
                time.sleep(5)
                
            if self.stop_flag:
                break

            try:
                if progress_callback:
                    progress_callback(f"Copying {filename} ({i+1}/{total_files})...")
                
                shutil.copy2(source_file, dest_file)
                
            except Exception as e:
                if error_callback:
                    error_callback(f"Error copying {filename}: {str(e)}")

    def stop_operation(self):
        self.stop_flag = True
