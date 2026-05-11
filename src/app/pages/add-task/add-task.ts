import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Supabase } from '../contacts/contact.service';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { TaskService } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';
import { Task } from '../../interfaces/task.interface';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AvatarComponent],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask implements OnInit {
  @Input() isDialog = false;
  @Input() initialStatus = 'To do';
  @Input() taskToEdit: Task | null = null;
  @Input() subtasksToEdit: any[] = [];
  @Output() taskCreated = new EventEmitter<void>();
  @Output() cancelClicked = new EventEmitter<void>();

  contactService = inject(Supabase);
  taskService = inject(TaskService);
  private router = inject(Router);

  contacts = this.contactService.contacts;
  categories = this.taskService.categories;

  selectedContacts: any[] = [];
  subtaskList: { title: string; completed: boolean }[] = [];
  maxVisibleContacts = 3;
  dropdownOpen = false;
  categoryDropdownOpen = false;
  moreContactsOpen = false;
  subtaskFocus = false;
  contactSearchTerm = '';
  isSubmitting = false;

  editingIndex: number | null = null;
  editingValue = '';
  todayDate: string = new Date().toISOString().split('T')[0];
  taskForm: FormGroup;

  pastDateValidators(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate < today ? { pastDate: true } : null;
  }

  constructor(private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', [Validators.required, this.pastDateValidators.bind(this)]],
      priority: [''],
      assignedTo: [[]],
      category: ['', Validators.required],
      subtasks: [''],
    });
  }

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

  get filteredContacts() {
    const term = this.contactSearchTerm.toLowerCase();
    return this.contacts().filter((c: any) => c.name.toLowerCase().includes(term));
  }

  async ngOnInit() {
    await Promise.all([this.contactService.getContacts(), this.taskService.getCategories()]);
    if (this.taskToEdit) {
      this.prefillForm();
    }
  }

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

  private parseAssignedTo(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('[')) {
        try { return JSON.parse(trimmed); } catch { }
      }
      return trimmed.split(',').map(n => n.trim()).filter(n => n.length > 0);
    }
    return [];
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleMoreContacts() {
    this.moreContactsOpen = !this.moreContactsOpen;
  }

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

  addSubtask() {
    const value = this.taskForm.get('subtasks')?.value;
    if (value && value.trim()) {
      this.subtaskList.push({
        title: value.trim(),
        completed: false,
      });
      this.taskForm.patchValue({ subtasks: '' });
      this.editingIndex = null;
    }
  }

  removeSubtask(index: number) {
    this.subtaskList.splice(index, 1);
  }

  editSubtask(index: number) {
    this.editingIndex = index;
    this.editingValue = this.subtaskList[index].title;
  }

  saveSubtask(index: number) {
    if (this.editingValue.trim()) {
      this.subtaskList[index].title = this.editingValue.trim();
    }

    this.editingIndex = null;
    this.editingValue = '';
  }

  setPriority(value: string) {
    this.taskForm.patchValue({ priority: value });
  }

  toastService = inject(ToastService);

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

  clear() {
    this.taskForm.reset({
      priority: '',
    });

    this.selectedContacts = [];
    this.subtaskList = [];
  }

  onCancelOrClear() {
    if (this.isDialog) {
      this.cancelClicked.emit();
    } else {
      this.clear();
    }
  }
}
