import customtkinter as ctk
import customtkinter as ctk
from gui import VideoAutomationApp
import premiere_handler
import file_manager

def main():
    ctk.set_appearance_mode("Dark")
    ctk.set_default_color_theme("blue")

    app = VideoAutomationApp()
    app.mainloop()

if __name__ == "__main__":
    main()
