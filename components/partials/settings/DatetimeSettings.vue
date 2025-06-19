<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import VueDatePicker from '@vuepic/vue-datepicker';
import { format } from 'date-fns';
import { useForm } from 'vee-validate';
import { z } from 'zod';

defineProps<{
  eventData: any
  isLoading?: boolean
}>();

const emit = defineEmits<{
  save: [data: any]
}>();

const datetimeSchema = toTypedSchema(z.object({
  eventDatetimes: z.array(z.object({
    name: z.string().min(1, 'Session name is required'),
    date_start: z.string(),
    date_end: z.string(),
    reg_limit: z.number().nullable(),
  })),
}));

const { handleSubmit, values, setValues } = useForm({
  validationSchema: datetimeSchema,
});

const addDatetime = () => {
  const current = values.eventDatetimes || [];
  setValues({
    eventDatetimes: [...current, {
      name: `Session ${current.length + 1}`,
      date_start: format(new Date(), 'yyyy-MM-dd HH:mm'),
      date_end: format(new Date(Date.now() + 2 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm'),
      reg_limit: null,
    }],
  });
};

const removeDatetime = (index: number) => {
  const current = [...(values.eventDatetimes || [])];
  current.splice(index, 1);
  setValues({ eventDatetimes: current });
};

const onSubmit = handleSubmit((formData) => {
  emit('save', formData);
});
</script>

<template>
  <form class="space-y-6" @submit="onSubmit">
    <Card>
      <CardHeader>
        <CardTitle>Event Sessions</CardTitle>
        <CardDescription>
          Configure event dates and times
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <FieldArray v-slot="{ fields }" name="eventDatetimes">
          <div class="space-y-4">
            <div v-for="(field, index) in fields" :key="field.key" class="rounded-lg border p-4">
              <div class="mb-4 flex items-center justify-between">
                <h4 class="font-medium">
                  Session {{ index + 1 }}
                </h4>
                <Button
                  v-if="fields.length > 1"
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="removeDatetime(index)"
                >
                  <Icon icon="mdi:delete" class="size-4" />
                </Button>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField v-slot="{ componentField }" :name="`eventDatetimes[${index}].name`">
                  <FormItem>
                    <FormLabel>Session Name</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" placeholder="Session name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" :name="`eventDatetimes[${index}].reg_limit`">
                  <FormItem>
                    <FormLabel>Registration Limit</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" type="number" placeholder="No limit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" :name="`eventDatetimes[${index}].date_start`">
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <VueDatePicker
                        v-bind="componentField"
                        :enable-time-picker="true"
                        format="yyyy-MM-dd HH:mm"
                        preview-format="dd MMM yyyy, HH:mm"
                        auto-apply
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" :name="`eventDatetimes[${index}].date_end`">
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <VueDatePicker
                        v-bind="componentField"
                        :enable-time-picker="true"
                        format="yyyy-MM-dd HH:mm"
                        preview-format="dd MMM yyyy, HH:mm"
                        auto-apply
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </div>
          </div>
        </FieldArray>

        <Button type="button" variant="outline" @click="addDatetime">
          <Icon icon="mdi:plus" class="mr-2 size-4" />
          Add Session
        </Button>
      </CardContent>
    </Card>

    <div class="flex justify-end">
      <Button type="submit" :disabled="isLoading">
        Save Changes
      </Button>
    </div>
  </form>
</template>
