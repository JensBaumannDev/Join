import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Supabase } from '../contacts/contact.service';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AvatarComponent],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask implements OnInit {

  contactService = inject(Supabase);
  taskService = inject(TaskService);
  private router = inject(Router);

  contacts = this.contactService.contacts;
  categories = this.taskService.categories;

  selectedContacts: any[] = [];
  maxVisibleContacts = 3;
  dropdownOpen = false;
  moreContactsOpen = false;

  taskForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', Validators.required],
      priority: ['Medium'],
      assignedTo: [[]],
      category: ['', Validators.required],
      subtasks: [''],
    });
  }


  async ngOnInit(){
    await Promise.all ([
      this.contactService.getContacts(),
      this.taskService.getCategories()
    ]);
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
      assignedTo: this.selectedContacts.map(c => c.name),
    });

  }

  setPriority(value: string) {
    this.taskForm.patchValue({ priority: value });
  }

  async submit() {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const newTask = {
        title: formValue.title,
        description: formValue.description,
        due_date: formValue.dueDate,
        priority: formValue.priority,
        category: formValue.category,
        assigned_to: formValue.assignedTo,
        status: 'To do' // Default status
      };

      await this.taskService.createTask(newTask as any);
      this.router.navigate(['/board']);
    } else {
      this.taskForm.markAllAsTouched();
    }
  }

  clear() {
    this.taskForm.reset({
      priority: 'Medium',
    });

    this.selectedContacts = [];
  }
}
