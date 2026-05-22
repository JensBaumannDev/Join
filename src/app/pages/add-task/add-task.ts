import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ContactService } from '../../services/contact.service';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { TaskService } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Task } from '../../interfaces/task.interface';
import { SubtaskInput } from '../../components/subtask-input/subtask-input';
import { parseAssignedTo } from '../../utils/task.utils';

/** Page/Dialog component for creating or editing tasks */
@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AvatarComponent, SubtaskInput],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask implements OnInit {
  /** Input flag indicating if component is rendered inside a modal dialog */
  @Input() isDialog = false;
  /** Input specifying the initial status column for the new task */
  @Input() initialStatus = 'To do';
  /** Input representing the task object to be edited, if any */
  @Input() taskToEdit: Task | null = null;
  /** Input representing subtasks of the edited task */
  @Input() subtasksToEdit: any[] = [];
  /** Output event emitted when task is successfully saved or created */
  @Output() taskCreated = new EventEmitter<void>();
  /** Output event emitted when user cancels task creation */
  @Output() cancelClicked = new EventEmitter<void>();

  /** Injectable ContactService for managing contacts */
  contactService = inject(ContactService);
  /** Injectable AuthService for fetching current user session details */
  protected authService = inject(AuthService);
  /** Injectable TaskService for managing task lists and categories */
  taskService = inject(TaskService);
  /** Injectable Router for page redirection */
  private router = inject(Router);

  /** Signal or array of all contacts */
  contacts = this.contactService.contacts;
  /** Signal or array of task categories */
  categories = this.taskService.categories;

  /** List of contacts assigned to the task */
  selectedContacts: any[] = [];
  /** List of subtasks to be created or updated */
  subtaskList: { title: string; completed: boolean }[] = [];
  /** Maximum number of contact avatars visible in preview */
  maxVisibleContacts = 3;
  /** Flag representing contact dropdown visibility */
  dropdownOpen = false;
  /** Flag representing category dropdown visibility */
  categoryDropdownOpen = false;
  /** Flag representing more-contacts popup visibility */
  moreContactsOpen = false;
  /** Input search term for filtering contacts */
  contactSearchTerm = '';
  /** State flag indicating if task submit is in progress */
  isSubmitting = false;
  /** String ISO date for today */
  todayDate: string = new Date().toISOString().split('T')[0];
  /** Form group for task input elements */
  taskForm: FormGroup;

  /**
   * Validation function ensuring the due date is not in the past.
   * 
   * @param control - The form control to validate.
   * @returns A validation error object if the date is in the past, or null if valid.
   */
  pastDateValidators(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate < today ? { pastDate: true } : null;
  }

  /**
   * Initializes form controls using FormBuilder.
   * 
   * @param fb - FormBuilder dependency.
   */
  constructor(private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', [Validators.required, this.pastDateValidators.bind(this)]],
      priority: ['Medium'],
      assignedTo: [[]],
      category: ['', Validators.required],
    });
  }

  /**
   * Document click listener to close dropdowns when clicking outside.
   * 
   * @param event - The mouse click event.
   */
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isAssignedClick = target.closest('.add-task__assigned');
    const isCategoryClick = target.closest('.add-task__category');
    const isMoreClick = target.closest('.add-task__more-wrapper');

    if (!isAssignedClick) {
      this.dropdownOpen = false;
      this.contactSearchTerm = '';
    }
    if (!isCategoryClick) {
      this.categoryDropdownOpen = false;
    }

    if (!isMoreClick) {
      this.moreContactsOpen = false;
    }
  }

  /** Gets filtered contacts based on the search query term. */
  get filteredContacts() {
    const term = this.contactSearchTerm.toLowerCase();
    return this.contacts().filter((c: any) => c.name.toLowerCase().includes(term));
  }

  /** Fetches contacts and categories on component initialization. */
  async ngOnInit() {
    await Promise.all([this.contactService.getContacts(), this.taskService.getCategories()]);
    if (this.taskToEdit) {
      this.prefillForm();
    }
  }

  /** Prefills form controls with the existing task and subtask data in edit mode. */
  private prefillForm() {
    const task = this.taskToEdit!;
    const assignedNames = this.parseAssignedTo(task.assigned_to);
    this.selectedContacts = this.contactService.contacts().filter(c => assignedNames.includes(c.name));
    this.subtaskList = this.subtasksToEdit.map(s => ({ title: s.title, completed: s.completed }));
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: task.due_date,
      priority: task.priority,
      category: task.category,
      assignedTo: this.selectedContacts.map(c => c.name),
    });
  }

  /**
   * Internal helper parsing assignments string array representation.
   * 
   * @param val - The raw assigned value (could be string, array, or null).
   * @returns An array of parsed names.
   */
  private parseAssignedTo(val: any): string[] {
    return parseAssignedTo(val);
  }

  /** Toggles the assigned contacts dropdown list visibility. */
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) this.categoryDropdownOpen = false;
  }

  /** Toggles the task categories dropdown list visibility. */
  toggleCategoryDropdown() {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
    if (this.categoryDropdownOpen) {
      this.dropdownOpen = false;
      this.contactSearchTerm = '';
    }
  }

  /** Toggles the expanded visual list of extra contact icons. */
  toggleMoreContacts() {
    this.moreContactsOpen = !this.moreContactsOpen;
  }

  /**
   * Toggles a contact's assignment on this task.
   * 
   * @param contact - The contact object to toggle.
   */
  toggleContact(contact: any) {
    const exists = this.selectedContacts.find((c) => c.id === contact.id);

    if (exists) {
      this.selectedContacts = this.selectedContacts.filter((c) => c.id !== contact.id);
    } else {
      this.selectedContacts.push(contact);
    }

    this.taskForm.patchValue({
      assignedTo: this.selectedContacts.map((c) => c.name),
    });
  }

  /**
   * Helper check to see if a contact matches the current user's email.
   * 
   * @param contact - The contact to check.
   * @returns True if it matches the current user, false otherwise.
   */
  isCurrentUserContact(contact: any): boolean {
    return this.authService.currentUser()?.email === contact?.email;
  }

  /**
   * Formats contact name label and appends '(You)' suffix for logged in user.
   * 
   * @param contact - The contact object.
   * @returns The formatted name label.
   */
  getContactLabel(contact: any): string {
    return this.isCurrentUserContact(contact) ? `${contact.name} (You)` : contact.name;
  }

  /**
   * Updates task priority field in the form.
   * 
   * @param value - The priority level to set (e.g. 'Low', 'Medium', 'Urgent').
   */
  setPriority(value: string) {
    this.taskForm.patchValue({ priority: value });
  }

  /** Injectable ToastService instance */
  toastService = inject(ToastService);

  /** Handles task form validation and submits new or edited task to database */
  async submit() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      if (this.taskForm.valid) {
        const formValue = this.taskForm.value;
        const taskData = {
          title: formValue.title,
          description: formValue.description,
          due_date: formValue.dueDate,
          priority: formValue.priority,
          category: formValue.category,
          assigned_to: formValue.assignedTo,
        };

        if (this.taskToEdit) {
          await this.taskService.updateTask(String(this.taskToEdit.id), taskData, this.subtaskList);
          this.toastService.show('Task updated');
          this.taskCreated.emit();
        } else {
          const newTask = { ...taskData, status: this.initialStatus };
          await this.taskService.createTask(newTask, this.subtaskList);
          this.toastService.show('Task added to board', true);

          if (this.isDialog) {
            this.taskCreated.emit();
          } else {
            setTimeout(() => {
              this.router.navigate(['/board']);
            }, 1000);
          }
        }
      } else {
        this.taskForm.markAllAsTouched();
        this.isSubmitting = false;
      }
    } catch {
      this.isSubmitting = false;
    }
  }

  /** Resets the form and selected contact list to initial values */
  clear() {
    this.taskForm.reset({
      priority: 'Medium',
    });

    this.selectedContacts = [];
    this.subtaskList = [];
  }

  /** Callback responding to cancel click event */
  onCancelOrClear() {
    if (this.isDialog) {
      this.cancelClicked.emit();
    } else {
      this.clear();
    }
  }
}
